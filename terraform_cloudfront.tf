# infra/terraform/cloudfront.tf
# Atlas Framework - AWS CloudFront CDN Configuration

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 Bucket for Frontend Assets
resource "aws_s3_bucket" "frontend" {
  bucket = "atlas-framework-frontend-\${var.environment}"

  tags = {
    Name        = "Atlas Frontend"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "Atlas Framework Frontend OAI"
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontAccess"
        Effect    = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.frontend.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "\${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

# ACM Certificate for Custom Domain
resource "aws_acm_certificate" "cert" {
  provider          = aws.us-east-1  # Must be in us-east-1 for CloudFront
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "www.\${var.domain_name}",
    "api.\${var.domain_name}",
    "*.api.\${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "Atlas Framework Certificate"
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "atlas" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Atlas Framework CDN"
  default_root_object = "index.html"
  price_class         = "PriceClass_All"  # Global edge locations

  aliases = [
    var.domain_name,
    "www.\${var.domain_name}"
  ]

  # Origin for Frontend (S3)
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-Frontend"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  # Origin for API (ALB)
  origin {
    domain_name = var.api_alb_dns_name
    origin_id   = "ALB-API"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default cache behavior (Frontend)
  default_cache_behavior {
    target_origin_id       = "S3-Frontend"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Cache behavior for API
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "ALB-API"
    viewer_protocol_policy = "https-only"
    compress               = true

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "CloudFront-Viewer-Country"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Cache behavior for WebSocket
  ordered_cache_behavior {
    path_pattern           = "/ws/*"
    target_origin_id       = "ALB-API"
    viewer_protocol_policy = "https-only"

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # SSL Certificate
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Custom error responses
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  tags = {
    Name        = "Atlas Framework CDN"
    Environment = var.environment
  }
}

# Route53 DNS Records
resource "aws_route53_record" "apex" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.atlas.domain_name
    zone_id                = aws_cloudfront_distribution.atlas.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = var.route53_zone_id
  name    = "www.\${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.atlas.domain_name
    zone_id                = aws_cloudfront_distribution.atlas.hosted_zone_id
    evaluate_target_health = false
  }
}

# Outputs
output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.atlas.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.atlas.domain_name
}

output "s3_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

# Variables
variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "production"
}

variable "domain_name" {
  description = "Your custom domain name"
}

variable "api_alb_dns_name" {
  description = "DNS name of API ALB"
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID"
}
