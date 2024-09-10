import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export class DB {
  private client: DynamoDBDocumentClient;
  constructor(
    private config: {
      tableName: string
      region: string
    }
  ) {
    this.client = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: this.config.region
      }),
      {
        marshallOptions: {
          removeUndefinedValues: true
        }
      }
    );
  }

  async save(doc: any) {
    const command = new PutCommand({
      TableName: this.config.tableName,
      Item: doc
    });
    const res = await this.client.send(command);
    return res;
  }
}
