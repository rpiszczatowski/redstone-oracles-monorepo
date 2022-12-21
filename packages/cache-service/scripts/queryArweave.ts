#!/usr/bin/env node

const {request, gql} = require('graphql-request');
const prompts = require('prompts');

const ARWEAVE_GRAPHQL_API_ENDPOINT = 'https://arweave.net/graphql'

const getPromptQuestions = () => {
  return  [
    {
      type: 'text',
      name: 'nodeAddress',
      message: 'Specify oracle node address'
    },
    {
      type: 'number',
      name: 'timestamp',
      message: 'Specify timestamp used in data package'
    },
  ];
}

const buildGraphQlQuery = (timestamp, nodeAddress) => {
  return gql`
  query {
    transactions(
      tags: [
      {
            name: "timestamp",
            values: ["${timestamp}"]
      },
      {
            name: "signerAddress",
            values: "${nodeAddress}"
      }]) 
  		{
        edges {
            node {
                id
              	owner {
                  address
                }
              	data {
                  size
                  type
                }
              tags{
                name
                value
              }
            }
        }
    }
}
  `;
}

async function queryArweave(){
  const {timestamp, nodeAddress} = await prompts(getPromptQuestions());
  const query = buildGraphQlQuery(timestamp, nodeAddress);
  await request(ARWEAVE_GRAPHQL_API_ENDPOINT, query).then((data) => console.log(JSON.stringify(data, null, 4)))
}


queryArweave().then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
})