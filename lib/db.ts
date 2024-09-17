import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  PutCommand,
  DynamoDBDocumentClient,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

export class DB<T extends { id: string }> {
  private client: DynamoDBDocumentClient;
  constructor(
    private config: {
      tableName: string;
      region: string;
    }
  ) {
    this.client = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: this.config.region,
      }),
      {
        marshallOptions: {
          removeUndefinedValues: true,
        },
      }
    );
  }

  async save(doc: T) {
    const command = new PutCommand({
      TableName: this.config.tableName,
      Item: doc,
    });
    const res = await this.client.send(command);
    return res;
  }

  async update({ id, attrs }: { id: string; attrs: Partial<Omit<T, "id">> }) {
    const UpdateExpressionArr: string[] = [];
    const ExpressionAttributeNames: Record<string, any> = {};
    const ExpressionAttributeValues: Record<string, any> = {};

    (Object.keys(attrs) as Array<keyof typeof attrs>).forEach((key) => {
      ExpressionAttributeNames[`#${String(key)}`] = key;
      ExpressionAttributeValues[`:${String(key)}`] = attrs[key];
      UpdateExpressionArr.push(`#${String(key)}=:${String(key)}`);
    });

    return this.client.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: {
          id: id,
        },
        UpdateExpression: `set ${UpdateExpressionArr.join(", ")}`,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      })
    );
  }
}
