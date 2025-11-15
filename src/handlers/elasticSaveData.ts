import { esClient } from '../config/elasticSearch.config';

const createIndex = async <T>(indexName: string, id: string, data: T) => {
  try {
    if (!indexName || !id || !data) return;

    const newData: any = { ...data };

    if (newData._id) delete newData._id;

    const clientExists = await esClient.indices.exists({
      index: indexName.toLowerCase(),
    });

    if (!clientExists) {
      await esClient.indices.create({ index: indexName.toLowerCase() });
    }
    await esClient.index({
      index: indexName.toLowerCase(),
      id,
      body: newData as any,
    });
    await esClient.indices.refresh({ index: indexName.toLowerCase() });
    console.log('index created');
  } catch (error) {
    console.log(error);
  }
};

const searchIndex = async (
  indexName: string,
  query: string,
  fields?: string[],
  page: number = 1,
  limit: number = 10
) => {
  try {
    const from = (page - 1) * limit;

    const response = await esClient.search({
      index: indexName.toLowerCase(),
      from: from,
      size: limit,
      body: {
        query: {
          multi_match: {
            query: query,
            fields: fields?.length ? fields : ["*"],
            fuzziness: "AUTO",
          },
        },
      },
    });

    const pagination= {
      total: (response?.hits?.total as any)?.value,   // total matched documents
      page: page,
      limit: limit,
      totalPage: Math.ceil(((response?.hits?.total as any)?.value||0) / limit),
    };

    return { data: response?.hits?.hits, pagination };
  } catch (error) {
    console.log(error);
    return null;
  }
};


const updateIndex = async <T>(indexName: string, id: string, data: T) => {
  try {
    if (!indexName || !id || !data) return;
    
    const newData: any = { ...data };

    if (newData._id) delete newData._id;
    await esClient.update({
      index: indexName.toLowerCase(),
      id,
      body: {
        doc: newData,
        doc_as_upsert: true,
      },
    });
  } catch (error) {
    console.log(error);
  }
};


const deleteIndex = async (indexName: string, id: string) => {
  try {
    if (!indexName || !id) return;
    await esClient.delete({
      index: indexName.toLowerCase(),
      id,
    });
  } catch (error) {
    console.log(error);
  }
}

export const elasticHelper = {
  createIndex,
  searchIndex,
  updateIndex,
  deleteIndex
};
