import { config as dotenvConfig } from "dotenv";
import {
    DynamoDBClient,
    CreateTableCommand,
    ScalarAttributeType,
    KeyType,
    ProjectionType, DeleteTableCommand
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
    try{
        const deleteTable = new DeleteTableCommand({
            TableName: "SingleTableApp"
        });

        const createTable = new CreateTableCommand(tableDefinition);

        // Cleaning up previous table
        /*try{
            const deleted = await getDynamoClient().send(deleteTable);
            console.log('Cleaned previous table', deleted);
        }catch (e){
            console.error("Not possible to delete previous created DynamoDB table", e);
        }
*/
        // Creating new table
        try{
            const created = await getDynamoClient().send(createTable);
            console.log('Created DynamoDB table:', created);
        }catch (e){
            console.error("Not possible to create DynamoDB table", e);
        }
    } catch (e){
        console.error('An error occurred while creating DynamoDB table:', e);
    }
}

let dynamoClient: DynamoDBClient | null = null;

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

export const connectDB = async () => {
    getDynamoClient();
    await initSingleTable();
}

let userEntity: any = null;

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
                    /*sk: {
                        type: "string",
                        default: () => 'USER',
                    },*/
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