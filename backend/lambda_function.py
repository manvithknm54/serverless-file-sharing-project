import json
import boto3
import base64
import uuid

s3 = boto3.client('s3')
BUCKET_NAME = 'bucket-serverless-file-sharing'

def lambda_handler(event, context):
    try:
        # Handle CORS preflight request
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS'
                },
                'body': ''
            }

        http_method = event.get('httpMethod', 'POST')

        # ─── DELETE FILE ───────────────────────────────────────────
        if http_method == 'DELETE':
            body = json.loads(event['body'])
            s3_key = body.get('s3_key')

            if not s3_key:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No file key provided.'})
                }

            s3.delete_object(Bucket=BUCKET_NAME, Key=s3_key)

            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'message': 'File deleted successfully!'
                })
            }

        # ─── UPLOAD FILE ───────────────────────────────────────────
        body = json.loads(event['body'])
        file_content = base64.b64decode(body['file_content'])
        file_name = body['file_name']
        file_type = body['file_type']
        bundle_id = body.get('bundle_id', None)

        # Accept all file types
        file_type = file_type or 'application/octet-stream'

        # Validate file size (max 10MB)
        if len(file_content) > 10 * 1024 * 1024:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'File too large. Max size is 10MB.'
                })
            }

        # Decide S3 path
        if bundle_id:
            s3_key = f'bundles/{bundle_id}/{file_name}'
        else:
            unique_id = str(uuid.uuid4())[:8]
            s3_key = f'single-files/{unique_id}_{file_name}'

        # Upload to S3
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            ContentType=file_type
        )

        # Generate URLs
        download_url = f'https://{BUCKET_NAME}.s3.ap-south-1.amazonaws.com/{s3_key}'
        bundle_url = None
        if bundle_id:
            bundle_url = f'https://{BUCKET_NAME}.s3.ap-south-1.amazonaws.com/bundles/{bundle_id}/'

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'File uploaded successfully!',
                'download_url': download_url,
                'file_name': file_name,
                's3_key': s3_key,
                'bundle_id': bundle_id,
                'bundle_url': bundle_url
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }