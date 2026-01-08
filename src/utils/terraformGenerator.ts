import type { ServiceNode, ServiceEdge } from '../types/architecture';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface TerraformResource {
  type: string;
  name: string;
  config: string;
  dependencies?: string[];
}

interface TerraformFiles {
  'main.tf': string;
  'variables.tf': string;
  'outputs.tf': string;
  'terraform.tfvars.example': string;
  'README.md': string;
}

// Map ArchFlow service IDs to Terraform resource generators
const serviceToTerraform: Record<
  string,
  (node: ServiceNode, index: number, edges: ServiceEdge[]) => TerraformResource | null
> = {
  // AWS Lambda
  'aws-lambda': (_node, index) => ({
    type: 'aws_lambda_function',
    name: `lambda_${index}`,
    config: `
resource "aws_lambda_function" "lambda_${index}" {
  filename         = "\${var.lambda_${index}_filename}"
  function_name    = "\${var.lambda_${index}_name}"
  role             = aws_iam_role.lambda_${index}_role.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("\${var.lambda_${index}_filename}")
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      ENVIRONMENT = "\${var.environment}"
    }
  }

  tags = {
    Name        = "\${var.lambda_${index}_name}"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_iam_role" "lambda_${index}_role" {
  name = "\${var.lambda_${index}_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_${index}_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_${index}_role.name
}
`,
    dependencies: [],
  }),

  // AWS S3
  'aws-s3': (_node, index) => ({
    type: 'aws_s3_bucket',
    name: `s3_${index}`,
    config: `
resource "aws_s3_bucket" "s3_${index}" {
  bucket = "\${var.s3_${index}_bucket_name}"

  tags = {
    Name        = "\${var.s3_${index}_bucket_name}"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_s3_bucket_versioning" "s3_${index}_versioning" {
  bucket = aws_s3_bucket.s3_${index}.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "s3_${index}_encryption" {
  bucket = aws_s3_bucket.s3_${index}.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "s3_${index}_block" {
  bucket = aws_s3_bucket.s3_${index}.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
`,
  }),

  // RDS Postgres
  'postgres-rds': (_node, index) => ({
    type: 'aws_db_instance',
    name: `rds_${index}`,
    config: `
resource "aws_db_instance" "rds_${index}" {
  identifier        = "\${var.rds_${index}_identifier}"
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = "\${var.rds_${index}_instance_class}"
  allocated_storage = \${var.rds_${index}_allocated_storage}

  db_name  = "\${var.rds_${index}_db_name}"
  username = "\${var.rds_${index}_username}"
  password = "\${var.rds_${index}_password}" # TODO: Use AWS Secrets Manager

  vpc_security_group_ids = [aws_security_group.rds_${index}_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.rds_${index}_subnet.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = false
  final_snapshot_identifier = "\${var.rds_${index}_identifier}-final-snapshot-\${timestamp()}"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name        = "\${var.rds_${index}_identifier}"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_security_group" "rds_${index}_sg" {
  name        = "\${var.rds_${index}_identifier}-sg"
  description = "Security group for RDS instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
    description = "PostgreSQL access from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "\${var.rds_${index}_identifier}-sg"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_db_subnet_group" "rds_${index}_subnet" {
  name       = "\${var.rds_${index}_identifier}-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "\${var.rds_${index}_identifier}-subnet-group"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}
`,
  }),

  // DynamoDB
  'dynamodb': (_node, index) => ({
    type: 'aws_dynamodb_table',
    name: `dynamodb_${index}`,
    config: `
resource "aws_dynamodb_table" "dynamodb_${index}" {
  name           = "\${var.dynamodb_${index}_table_name}"
  billing_mode   = "\${var.dynamodb_${index}_billing_mode}"

  # For PROVISIONED mode
  read_capacity  = var.dynamodb_${index}_billing_mode == "PROVISIONED" ? var.dynamodb_${index}_read_capacity : null
  write_capacity = var.dynamodb_${index}_billing_mode == "PROVISIONED" ? var.dynamodb_${index}_write_capacity : null

  hash_key  = "id"
  range_key = "timestamp"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  ttl {
    attribute_name = "TimeToExist"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "\${var.dynamodb_${index}_table_name}"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}
`,
  }),

  // AWS ECS
  'aws-ecs': (_node, index) => ({
    type: 'aws_ecs_cluster',
    name: `ecs_${index}`,
    config: `
resource "aws_ecs_cluster" "ecs_${index}" {
  name = "\${var.ecs_${index}_cluster_name}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "\${var.ecs_${index}_cluster_name}"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_ecs_task_definition" "ecs_${index}_task" {
  family                   = "\${var.ecs_${index}_cluster_name}-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "\${var.ecs_${index}_cpu}"
  memory                   = "\${var.ecs_${index}_memory}"
  execution_role_arn       = aws_iam_role.ecs_${index}_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_${index}_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "\${var.ecs_${index}_cluster_name}-container"
      image     = "\${var.ecs_${index}_image}"
      essential = true

      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/\${var.ecs_${index}_cluster_name}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      environment = [
        {
          name  = "ENVIRONMENT"
          value = "\${var.environment}"
        }
      ]
    }
  ])

  tags = {
    Name        = "\${var.ecs_${index}_cluster_name}"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_ecs_service" "ecs_${index}_service" {
  name            = "\${var.ecs_${index}_cluster_name}-service"
  cluster         = aws_ecs_cluster.ecs_${index}.id
  task_definition = aws_ecs_task_definition.ecs_${index}_task.arn
  desired_count   = \${var.ecs_${index}_desired_count}
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_${index}_sg.id]
    assign_public_ip = false
  }

  tags = {
    Name        = "\${var.ecs_${index}_cluster_name}"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_security_group" "ecs_${index}_sg" {
  name        = "\${var.ecs_${index}_cluster_name}-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "\${var.ecs_${index}_cluster_name}-sg"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_iam_role" "ecs_${index}_execution_role" {
  name = "\${var.ecs_${index}_cluster_name}-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role" "ecs_${index}_task_role" {
  name = "\${var.ecs_${index}_cluster_name}-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_${index}_execution_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  role       = aws_iam_role.ecs_${index}_execution_role.name
}

resource "aws_cloudwatch_log_group" "ecs_${index}_logs" {
  name              = "/ecs/\${var.ecs_${index}_cluster_name}"
  retention_in_days = 7

  tags = {
    Name        = "\${var.ecs_${index}_cluster_name}-logs"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}
`,
  }),

  // SQS
  'sqs': (_node, index) => ({
    type: 'aws_sqs_queue',
    name: `sqs_${index}`,
    config: `
resource "aws_sqs_queue" "sqs_${index}" {
  name                       = "\${var.sqs_${index}_queue_name}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600 # 14 days
  max_message_size           = 262144  # 256 KB
  delay_seconds              = 0
  receive_wait_time_seconds  = 20 # Long polling

  # Dead letter queue configuration
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.sqs_${index}_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name        = "\${var.sqs_${index}_queue_name}"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_sqs_queue" "sqs_${index}_dlq" {
  name                       = "\${var.sqs_${index}_queue_name}-dlq"
  message_retention_seconds  = 1209600 # 14 days

  tags = {
    Name        = "\${var.sqs_${index}_queue_name}-dlq"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}
`,
  }),

  // SNS
  'sns': (_node, index) => ({
    type: 'aws_sns_topic',
    name: `sns_${index}`,
    config: `
resource "aws_sns_topic" "sns_${index}" {
  name = "\${var.sns_${index}_topic_name}"

  tags = {
    Name        = "\${var.sns_${index}_topic_name}"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}
`,
  }),

  // CloudFront
  'cloudfront': (_node, index) => ({
    type: 'aws_cloudfront_distribution',
    name: `cloudfront_${index}`,
    config: `
resource "aws_cloudfront_distribution" "cloudfront_${index}" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "\${var.cloudfront_${index}_comment}"
  default_root_object = "index.html"

  origin {
    domain_name = "\${var.cloudfront_${index}_origin_domain}"
    origin_id   = "S3Origin"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.cloudfront_${index}_oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "\${var.cloudfront_${index}_comment}"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_cloudfront_origin_access_identity" "cloudfront_${index}_oai" {
  comment = "OAI for \${var.cloudfront_${index}_comment}"
}
`,
  }),

  // API Gateway
  'aws-api-gateway': (_node, index) => ({
    type: 'aws_apigatewayv2_api',
    name: `api_gateway_${index}`,
    config: `
resource "aws_apigatewayv2_api" "api_gateway_${index}" {
  name          = "\${var.api_gateway_${index}_name}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["\${var.api_gateway_${index}_cors_origin}"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
    max_age       = 300
  }

  tags = {
    Name        = "\${var.api_gateway_${index}_name}"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_apigatewayv2_stage" "api_gateway_${index}_stage" {
  api_id      = aws_apigatewayv2_api.api_gateway_${index}.id
  name        = "\${var.environment}"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_${index}_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = {
    Name        = "\${var.api_gateway_${index}_name}-\${var.environment}"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_cloudwatch_log_group" "api_gateway_${index}_logs" {
  name              = "/aws/apigateway/\${var.api_gateway_${index}_name}"
  retention_in_days = 7

  tags = {
    Name        = "\${var.api_gateway_${index}_name}-logs"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}
`,
  }),

  // ALB
  'aws-alb': (_node, index) => ({
    type: 'aws_lb',
    name: `alb_${index}`,
    config: `
resource "aws_lb" "alb_${index}" {
  name               = "\${var.alb_${index}_name}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_${index}_sg.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2              = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name        = "\${var.alb_${index}_name}"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_lb_target_group" "alb_${index}_tg" {
  name        = "\${var.alb_${index}_name}-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  tags = {
    Name        = "\${var.alb_${index}_name}-tg"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_lb_listener" "alb_${index}_listener" {
  load_balancer_arn = aws_lb.alb_${index}.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.alb_${index}_tg.arn
  }
}

resource "aws_security_group" "alb_${index}_sg" {
  name        = "\${var.alb_${index}_name}-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from Internet"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from Internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "\${var.alb_${index}_name}-sg"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}
`,
  }),

  // ElastiCache Redis
  'redis-elasticache': (_node, index) => ({
    type: 'aws_elasticache_cluster',
    name: `elasticache_${index}`,
    config: `
resource "aws_elasticache_cluster" "elasticache_${index}" {
  cluster_id           = "\${var.elasticache_${index}_cluster_id}"
  engine               = "redis"
  node_type            = "\${var.elasticache_${index}_node_type}"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.elasticache_${index}_subnet.name
  security_group_ids   = [aws_security_group.elasticache_${index}_sg.id]

  tags = {
    Name        = "\${var.elasticache_${index}_cluster_id}"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_elasticache_subnet_group" "elasticache_${index}_subnet" {
  name       = "\${var.elasticache_${index}_cluster_id}-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "\${var.elasticache_${index}_cluster_id}-subnet-group"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_security_group" "elasticache_${index}_sg" {
  name        = "\${var.elasticache_${index}_cluster_id}-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
    description = "Redis access from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "\${var.elasticache_${index}_cluster_id}-sg"
    Environment = "\${var.environment}"
    ManagedBy   = "ArchFlow"
  }
}
`,
  }),
};

// SaaS services that don't have Terraform configs
const saasServices = [
  'vercel',
  'netlify',
  'cloudflare-pages',
  'supabase',
  'planetscale',
  'mongodb-atlas',
  'auth0',
  'clerk',
  'algolia',
  'datadog',
  'stripe',
  'resend',
  'sendgrid',
  'aws-ses',
  'sanity',
  'contentful',
  'strapi',
  'upstash-redis',
  'railway',
  'render',
  'doppler',
  'github-actions',
];

function generateSaaSComment(service: ServiceNode): string {
  return `
# ${service.data.service.name} (${service.data.service.provider})
# This is a managed SaaS service configured via ${service.data.service.provider}'s dashboard
# Documentation: ${service.data.service.documentation || 'Check provider website'}
# Estimated Cost: $${service.data.service.costModel?.estimatedMonthlyCost?.min || 0}-${service.data.service.costModel?.estimatedMonthlyCost?.max || 0}/month
`;
}

function generateNetworkingInfrastructure(needsVpc: boolean): string {
  if (!needsVpc) return '';

  return `
# VPC and Networking Infrastructure
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "\${var.project_name}-vpc"
    Environment = var.environment
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "\${var.project_name}-public-\${count.index + 1}"
    Environment = var.environment
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 100)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "\${var.project_name}-private-\${count.index + 1}"
    Environment = var.environment
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "\${var.project_name}-igw"
    Environment = var.environment
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name        = "\${var.project_name}-nat-eip-\${count.index + 1}"
    Environment = var.environment
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "\${var.project_name}-nat-\${count.index + 1}"
    Environment = var.environment
    ManagedBy   = "ArchFlow"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "\${var.project_name}-public-rt"
    Environment = var.environment
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "\${var.project_name}-private-rt-\${count.index + 1}"
    Environment = var.environment
    ManagedBy   = "ArchFlow"
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

data "aws_availability_zones" "available" {
  state = "available"
}
`;
}

export async function exportToTerraform(nodes: ServiceNode[], _edges: ServiceEdge[]): Promise<void> {
  const files: TerraformFiles = {
    'main.tf': '',
    'variables.tf': '',
    'outputs.tf': '',
    'terraform.tfvars.example': '',
    'README.md': '',
  };

  // Header for main.tf
  files['main.tf'] = `# Generated by ArchFlow - https://markkatsdesign.github.io/archflow
# Generated on: ${new Date().toISOString()}
#
# This Terraform configuration represents your architecture design.
# Please review and customize the variables before applying.

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      GeneratedBy = "ArchFlow"
    }
  }
}
`;

  // Initialize variables
  files['variables.tf'] = `# Variables for your infrastructure
# Customize these values in terraform.tfvars

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}
`;

  files['terraform.tfvars.example'] = `# Copy this file to terraform.tfvars and customize
# cp terraform.tfvars.example terraform.tfvars

aws_region   = "us-east-1"
project_name = "my-project"
environment  = "dev"
vpc_cidr     = "10.0.0.0/16"
`;

  files['outputs.tf'] = `# Output values from your infrastructure
`;

  // Track which services need VPC
  const vpcRequiredServices = [
    'postgres-rds',
    'dynamodb',
    'aws-ecs',
    'redis-elasticache',
    'aws-alb',
  ];
  const needsVpc = nodes.some((node) => vpcRequiredServices.includes(node.data.service.id));

  // Add networking infrastructure if needed
  if (needsVpc) {
    files['main.tf'] += generateNetworkingInfrastructure(true);
  }

  // Process each service node
  const resources: TerraformResource[] = [];
  const saasComments: string[] = [];

  nodes.forEach((node, index) => {
    const serviceId = node.data.service.id;

    if (saasServices.includes(serviceId)) {
      // Generate comment for SaaS services
      saasComments.push(generateSaaSComment(node));
    } else if (serviceToTerraform[serviceId]) {
      // Generate Terraform resource
      const resource = serviceToTerraform[serviceId](node, index, _edges);
      if (resource) {
        resources.push(resource);
      }
    } else {
      // Unknown service - add as comment
      saasComments.push(`
# ${node.data.service.name}
# TODO: Add Terraform configuration for ${node.data.service.name}
# This service may require manual configuration or a different provider
`);
    }
  });

  // Add SaaS comments
  if (saasComments.length > 0) {
    files['main.tf'] += `
# ==============================================================================
# MANAGED SAAS SERVICES
# ==============================================================================
# The following services are managed via their respective dashboards
# and do not require Terraform configuration
# ==============================================================================

${saasComments.join('\n')}
`;
  }

  // Add resource configurations
  if (resources.length > 0) {
    files['main.tf'] += `
# ==============================================================================
# INFRASTRUCTURE RESOURCES
# ==============================================================================

${resources.map((r) => r.config).join('\n')}
`;
  }

  // Generate variables for each resource
  resources.forEach((resource) => {
    const varSection = generateVariablesForResource(resource);
    if (varSection) {
      files['variables.tf'] += '\n' + varSection;
    }

    const tfvarsSection = generateTfvarsForResource(resource);
    if (tfvarsSection) {
      files['terraform.tfvars.example'] += '\n' + tfvarsSection;
    }

    const outputSection = generateOutputsForResource(resource);
    if (outputSection) {
      files['outputs.tf'] += '\n' + outputSection;
    }
  });

  // Generate README
  files['README.md'] = generateReadme(nodes, _edges, needsVpc);

  // Create ZIP file
  const zip = new JSZip();
  Object.entries(files).forEach(([filename, content]) => {
    zip.file(filename, content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `terraform-${Date.now()}.zip`);
}

function generateVariablesForResource(resource: TerraformResource): string {
  // Extract variable names from the resource config
  const varMatches = resource.config.match(/var\.(\w+)/g);
  if (!varMatches) return '';

  const uniqueVars = [...new Set(varMatches.map((v) => v.replace('var.', '')))];
  const excludeVars = ['aws_region', 'project_name', 'environment', 'vpc_cidr'];

  return uniqueVars
    .filter((v) => !excludeVars.includes(v))
    .map((varName) => {
      return `
variable "${varName}" {
  description = "${varName.replace(/_/g, ' ')}"
  type        = string
}`;
    })
    .join('\n');
}

function generateTfvarsForResource(resource: TerraformResource): string {
  const varMatches = resource.config.match(/var\.(\w+)/g);
  if (!varMatches) return '';

  const uniqueVars = [...new Set(varMatches.map((v) => v.replace('var.', '')))];
  const excludeVars = ['aws_region', 'project_name', 'environment', 'vpc_cidr'];

  return uniqueVars
    .filter((v) => !excludeVars.includes(v))
    .map((varName) => {
      // Generate sensible default values
      if (varName.includes('name')) return `${varName} = "my-${varName}"`;
      if (varName.includes('filename')) return `${varName} = "lambda.zip"`;
      if (varName.includes('bucket')) return `${varName} = "my-bucket-\${random_id}"`;
      if (varName.includes('identifier')) return `${varName} = "my-db"`;
      if (varName.includes('instance_class')) return `${varName} = "db.t3.micro"`;
      if (varName.includes('allocated_storage')) return `${varName} = 20`;
      if (varName.includes('username')) return `${varName} = "admin"`;
      if (varName.includes('password')) return `${varName} = "CHANGE_ME_SECURE_PASSWORD"`;
      if (varName.includes('db_name')) return `${varName} = "mydb"`;
      if (varName.includes('cpu')) return `${varName} = "256"`;
      if (varName.includes('memory')) return `${varName} = "512"`;
      if (varName.includes('image')) return `${varName} = "nginx:latest"`;
      if (varName.includes('desired_count')) return `${varName} = 2`;
      if (varName.includes('billing_mode')) return `${varName} = "PAY_PER_REQUEST"`;
      if (varName.includes('read_capacity')) return `${varName} = 5`;
      if (varName.includes('write_capacity')) return `${varName} = 5`;
      if (varName.includes('node_type')) return `${varName} = "cache.t3.micro"`;
      if (varName.includes('cors_origin')) return `${varName} = "*"`;
      if (varName.includes('domain')) return `${varName} = "example.com"`;
      return `${varName} = "TODO_SET_VALUE"`;
    })
    .join('\n');
}

function generateOutputsForResource(resource: TerraformResource): string {
  const outputs: string[] = [];

  if (resource.type === 'aws_lambda_function') {
    outputs.push(`
output "${resource.name}_arn" {
  description = "ARN of Lambda function ${resource.name}"
  value       = aws_lambda_function.${resource.name}.arn
}`);
  }

  if (resource.type === 'aws_s3_bucket') {
    outputs.push(`
output "${resource.name}_name" {
  description = "Name of S3 bucket ${resource.name}"
  value       = aws_s3_bucket.${resource.name}.bucket
}

output "${resource.name}_arn" {
  description = "ARN of S3 bucket ${resource.name}"
  value       = aws_s3_bucket.${resource.name}.arn
}`);
  }

  if (resource.type === 'aws_db_instance') {
    outputs.push(`
output "${resource.name}_endpoint" {
  description = "Endpoint of RDS instance ${resource.name}"
  value       = aws_db_instance.${resource.name}.endpoint
}

output "${resource.name}_address" {
  description = "Address of RDS instance ${resource.name}"
  value       = aws_db_instance.${resource.name}.address
}`);
  }

  if (resource.type === 'aws_lb') {
    outputs.push(`
output "${resource.name}_dns" {
  description = "DNS name of ALB ${resource.name}"
  value       = aws_lb.${resource.name}.dns_name
}`);
  }

  if (resource.type === 'aws_apigatewayv2_api') {
    outputs.push(`
output "${resource.name}_endpoint" {
  description = "Endpoint of API Gateway ${resource.name}"
  value       = aws_apigatewayv2_api.${resource.name}.api_endpoint
}`);
  }

  return outputs.join('\n');
}

function generateReadme(nodes: ServiceNode[], _edges: ServiceEdge[], needsVpc: boolean): string {
  const awsServices = nodes.filter((n) => !saasServices.includes(n.data.service.id));
  const saasServicesList = nodes.filter((n) => saasServices.includes(n.data.service.id));

  return `# Infrastructure as Code - Generated by ArchFlow

**Generated on:** ${new Date().toLocaleString()}
**Total Services:** ${nodes.length}
**Terraform Resources:** ${awsServices.length}
**SaaS Services:** ${saasServicesList.length}

## Architecture Overview

This Terraform configuration represents your architecture design from ArchFlow.

### AWS Resources (${awsServices.length})
${awsServices.map((n) => `- **${n.data.service.name}** (${n.data.service.category})`).join('\n')}

### Managed SaaS Services (${saasServicesList.length})
${saasServicesList
  .map(
    (n) =>
      `- **${n.data.service.name}** - Configure via [${n.data.service.provider}](${n.data.service.documentation || '#'})`
  )
  .join('\n')}

## Prerequisites

1. **Terraform**: Install Terraform >= 1.0
   \`\`\`bash
   # macOS
   brew install terraform

   # Or download from https://www.terraform.io/downloads
   \`\`\`

2. **AWS CLI**: Configure AWS credentials
   \`\`\`bash
   aws configure
   \`\`\`

3. **AWS Account**: Ensure you have appropriate IAM permissions

## Setup Instructions

### Step 1: Customize Variables

1. Copy the example tfvars file:
   \`\`\`bash
   cp terraform.tfvars.example terraform.tfvars
   \`\`\`

2. Edit \`terraform.tfvars\` with your values:
   - Update \`project_name\` to your project name
   - Change \`aws_region\` if needed
   - Set all service-specific variables
   - **IMPORTANT**: Replace all passwords with secure values

### Step 2: Review Configuration

1. Open \`main.tf\` and review all resources
2. Adjust instance sizes, storage, and configurations as needed
3. Review security group rules and IAM policies

### Step 3: Initialize Terraform

\`\`\`bash
terraform init
\`\`\`

### Step 4: Plan Deployment

\`\`\`bash
terraform plan
\`\`\`

Review the planned changes carefully before applying.

### Step 5: Apply Configuration

\`\`\`bash
terraform apply
\`\`\`

Type \`yes\` when prompted to confirm.

## Important Notes

### Security Considerations

${
  awsServices.some((n) => n.data.service.id === 'postgres-rds')
    ? `
- **Database Passwords**: The RDS password is stored in \`terraform.tfvars\`. Consider using AWS Secrets Manager instead.
- **Security Groups**: Review all security group rules and restrict access as needed.
`
    : ''
}
${
  needsVpc
    ? `- **VPC Configuration**: A VPC with public and private subnets is automatically created.
- **NAT Gateways**: Two NAT gateways are created for high availability (additional cost).
`
    : ''
}

### Cost Estimates

Based on your architecture design:
${nodes
  .filter((n) => n.data.service.costModel?.estimatedMonthlyCost)
  .map((n) => {
    const cost = n.data.service.costModel!.estimatedMonthlyCost!;
    return `- **${n.data.service.name}**: $${cost.min}-${cost.max}/month`;
  })
  .join('\n')}

**Note**: Actual costs may vary based on usage, data transfer, and other factors.

### Manual Configuration Required

The following services need manual setup via their dashboards:
${saasServicesList
  .map(
    (n) =>
      `
#### ${n.data.service.name}
- Sign up at: ${n.data.service.documentation || `https://${n.data.service.provider.toLowerCase().replace(' ', '')}.com`}
- Follow their getting started guide
- Update your application with API keys/credentials
`
  )
  .join('\n')}

## Outputs

After applying, Terraform will output important values like:
- Database endpoints
- Load balancer DNS names
- API Gateway URLs
- S3 bucket names

Access these with:
\`\`\`bash
terraform output
\`\`\`

## Cleanup

To destroy all resources:
\`\`\`bash
terraform destroy
\`\`\`

**WARNING**: This will delete all resources. Ensure you have backups if needed.

## Next Steps

1. ✅ Review and apply Terraform configuration
2. ✅ Configure SaaS services via their dashboards
3. ✅ Update application code with connection strings and API keys
4. ✅ Set up CI/CD pipelines for automated deployments
5. ✅ Configure monitoring and alerting
6. ✅ Implement backup and disaster recovery procedures

## Support

- **Terraform Documentation**: https://www.terraform.io/docs
- **AWS Documentation**: https://docs.aws.amazon.com
- **ArchFlow**: https://markkatsdesign.github.io/archflow

---

Generated by [ArchFlow](https://markkatsdesign.github.io/archflow) - Visual System Architecture Designer
`;
}
