import { config as dotenvConfig } from "dotenv";
import {
    DynamoDBClient,
    CreateTableCommand,
    DescribeTableCommand,
    ScalarAttributeType,
    KeyType,
    ProjectionType
} from '@aws-sdk/client-dynamodb';
import { v4 as uuid } from 'uuid';
import { Entity } from 'electrodb';

dotenvConfig();

const { AWS_REGION, AWS_ACCESS_KEY, AWS_SECRET_KEY } = process.env;

const tableDefinition = {
    TableName: "SingleTableApp",
    KeySchema: [
        { AttributeName: "pk", KeyType: KeyType.HASH },
        { AttributeName: "sk", KeyType: KeyType.RANGE }
    ],
    AttributeDefinitions: [
        { AttributeName: "pk", AttributeType: ScalarAttributeType.S },
        { AttributeName: "sk", AttributeType: ScalarAttributeType.S },
        { AttributeName: "gsi1pk", AttributeType: ScalarAttributeType.S },
        { AttributeName: "gsi1sk", AttributeType: ScalarAttributeType.S },
        { AttributeName: "gsi2pk", AttributeType: ScalarAttributeType.S },
        { AttributeName: "gsi2sk", AttributeType: ScalarAttributeType.S }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: "emailIndex",
            KeySchema: [
                { AttributeName: "gsi1pk", KeyType: KeyType.HASH },
                { AttributeName: "gsi1sk", KeyType: KeyType.RANGE }
            ],
            Projection: { ProjectionType: ProjectionType.ALL }
        },
        {
            IndexName: "byUserIndex",
            KeySchema: [
                { AttributeName: "gsi2pk", KeyType: KeyType.HASH },
                { AttributeName: "gsi2sk", KeyType: KeyType.RANGE }
            ],
            Projection: { ProjectionType: ProjectionType.ALL }
        }
    ],
    BillingMode: "PAY_PER_REQUEST" as const
};


const initSingleTable = async () => {
        // Check if table already exists, not checking status for simplicity
        // It is important to make sure the table exists, because electroDB does not manages it
        let existingTable;
        try{
            const getTable = new DescribeTableCommand({TableName: "SingleTableApp"});
            existingTable = await getDynamoClient().send(getTable);
            console.log('DynamoDB table already exists:', existingTable);
        }catch {}

        // If for some reason the table not exists let's create it
        if(!existingTable){
            try{
                const createTable = new CreateTableCommand(tableDefinition);
                const created = await getDynamoClient().send(createTable);
                console.log('Created new DynamoDB table:', created);
            }catch (e){
                console.error("Not possible to create DynamoDB table", e);
            }
        }
}

let dynamoClient: DynamoDBClient | null = null;

// Singleton pattern to get the DynamoDB client
export function getDynamoClient(): DynamoDBClient {
    if (!dynamoClient) {
        dynamoClient = new DynamoDBClient({
            region: AWS_REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY as string,
                secretAccessKey: AWS_SECRET_KEY as string,
            },
        });
    }
    return dynamoClient;
}

// Connect to the database and create the table if not exists
export const connectDB = async () => {
    getDynamoClient();
    await initSingleTable();
}

let userEntity: any = null;

// Singleton pattern to get the User entity
export const getUserEntity = () => {
    if(!userEntity){
        userEntity = new Entity({
                model: {
                    entity: 'User',
                    service: 'SingleTableApp',
                    version: '1'
                },
                attributes: {
                    id: {
                        type: 'string',
                        default: () => uuid(),
                    },
                    name: {
                        type: 'string',
                        required: true
                    },
                    email: {
                        type: 'string',
                        required: true
                    },
                    createdAt: {
                        type: 'string',
                        default: () => new Date().toISOString()
                    },
                    updatedAt: {
                        type: 'string',
                        default: () => new Date().toISOString(),
                        watch: '*',
                    }
                },
                indexes: {
                    byId: {
                        pk: {
                            field: 'pk',
                            composite: ['id']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['createdAt']
                        }
                    },
                    byEmail: {
                        index: 'emailIndex',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['email']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['createdAt']
                        }
                    }
                },
            },
            {table: 'SingleTableApp', client: getDynamoClient()}
        )}

    return userEntity;
}

let messageEntity: any = null;

// Singleton pattern to get the Message entity
export const getMessageEntity = () => {
    if(!messageEntity){
        messageEntity = new Entity(
            {
                model: {
                    entity: 'Message',
                    service: 'SingleTableApp',
                    version: '1'
                },
                attributes: {
                    id: {
                        type: 'string',
                        default: () => uuid(),
                    },
                    userId: {
                        type: "string",
                        required: true
                    },
                    message: {
                        type: 'string',
                        required: true
                    },
                    createdAt: {
                        type: 'string',
                        default: () => new Date().toISOString()
                    },
                    updatedAt: {
                        type: 'string',
                        default: () => new Date().toISOString(),
                        watch: '*',
                    }

                },
                indexes: {
                    byId: {
                        pk: {
                            field: 'pk',
                            composite: ['id']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['createdAt']
                        }
                    },
                    byUser: {
                        index: 'byUserIndex',
                        pk: {
                            field: 'gsi2pk',
                            composite: ['userId']
                        },
                        sk: {
                            field: 'gsi2sk',
                            composite: ['createdAt']
                        }
                    }
                },
            },
            {table: 'SingleTableApp', client: getDynamoClient()})
    }
    return messageEntity;
}