import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as glue from '@aws-cdk/aws-glue-alpha';
import {S3Table} from "@aws-cdk/aws-glue-alpha";

export class FlightsStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // 1. Bucket S3 raw zone
        const rawBucket = new s3.Bucket(this, 'RawBucket', {
            bucketName: `flights-raw-${this.account}`,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            lifecycleRules: [{ transitions: [{ storageClass: s3.StorageClass.INTELLIGENT_TIERING, transitionAfter: Duration.days(30) }] }]
        });

        // 2. Glue database
        const db = new glue.Database(this, 'FlightsDB', {
            databaseName: 'flights_demo',
        });

        // 3. Glue table Iceberg (v3) — vacía
        new S3Table(this, 'FlightLegsTable', {
            database: db,
            tableName: 'flight_legs',
            bucket: rawBucket,
            s3Prefix: 'iceberg/flight_legs/',
            dataFormat: glue.DataFormat.PARQUET,
            columns: [
                { name: 'flight_id', type: glue.Schema.STRING },
                { name: 'departure_ts', type: glue.Schema.TIMESTAMP },
                { name: 'origin', type: glue.Schema.STRING },
                { name: 'destination', type: glue.Schema.STRING },
                { name: 'status', type: glue.Schema.STRING }
            ],
            partitionKeys: [
                { name: 'year', type: glue.Schema.INTEGER },
                { name: 'month', type: glue.Schema.INTEGER }
            ],
            parameters: {
                // Iceberg table type and version
                'table_type': 'ICEBERG',
                'version': '3',
                'iceberg.enabled': 'true',
                
                // File format settings
                'format': 'parquet',
                'iceberg.file_format': 'PARQUET',
                'write_compression': 'zstd',
                
                // Catalog configuration
                'iceberg.catalog': 'glue',
                
                // Maintenance and optimization settings
                'iceberg.vacuum_min_snapshots_to_keep': '2',
                'retention.delete.num.snapshots': '2',
                'optimize_rewrite_delete_file_threshold': '10'
            },
            description: 'Flight legs data stored in Iceberg format v3 partitioned by year and month'
        });

    }
}
