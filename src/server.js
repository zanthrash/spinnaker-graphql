import {
		graphql,
		GraphQLSchema,
		GraphQLObjectType,
		GraphQLString,
		GraphQLList,
} from 'graphql';
import  graphqlHTTP  from 'express-graphql';
import express from 'express';
import cors from 'cors';
import axios  from 'axios';

const baseUrl = 'http://spinnaker-api.prod.netflix.net/'

const dumpJSON = (payload) => {
	console.log(JSON.stringify(payload, null, 2))
};

const getApplication = (name) => {
	return axios.get(`${baseUrl}/applications/${name}`)
		.then((result) => {
			dumpJSON(result.data);
			return result.data;
		})
};

const getServerGroups = (appName) => {
	return axios.get(`${baseUrl}/applications/${appName}/serverGroups`)
			.then((result) => {
				dumpJSON(result.data);
				return result.data;
			})
}

const applicationAttributesType = new GraphQLObjectType({
	name: "AppAttributes",
	fields: {
		description: {
			type: GraphQLString,
			description: 'The description of the application'
		},
		email: {
			type: GraphQLString
		},
		owner: {
			type: GraphQLString
		}
	}
});


const clusterType = new GraphQLObjectType({
	name: 'ClusterType',
	fields: {
		name: { type: GraphQLString },
		serverGroups: {
			type: new GraphQLList(GraphQLString)
		}
	}
});

const clustersType = new GraphQLObjectType({
	name: "AppClusters",
	fields: {
		prod: {
			type: new GraphQLList(clusterType)
		},
		test: {
			type: new GraphQLList(clusterType)
		},
	}
});

const serverGroupType = new GraphQLObjectType({
	name: 'ServerGroups',
	fields: {
		name: { type: GraphQLString },
		account: { type: GraphQLString },
		region: { type: GraphQLString },
		cluster: { type: GraphQLString },
	}
});

const applicationType = new GraphQLObjectType({
	name: 'Application',
	fields: {
		name: {
			type: GraphQLString,
			description: 'The name of the application'
		},
		attributes: {
			type: applicationAttributesType
		},
		clusters: {
			type: clustersType
		},
		serverGroups: {
			type: new GraphQLList(serverGroupType),
			args:{
				app: {
					type: GraphQLString
				}
			},
			resolve: (root, {app}) => getServerGroups(app)
		}
	}
});

const spinType = new GraphQLObjectType({
	name: "SpinAPI",
	fields: {
		application: {
			type: applicationType,
			args: {
				name: {
					type: GraphQLString
				}
			},
			resolve: (_, { name }) => getApplication(name)
		}
	}
});

const blaType = new GraphQLObjectType({
	name: 'blah',
	fields: {
		street: {
			type: GraphQLString,
		},
		boom: {
			type: GraphQLString,
			resolve() {
				return "bang bang boom"
			}
		}
	}
});

const queryType = new GraphQLObjectType({
	name: 'SpinnakerAPI',
	fields: {
		spin: {
			type: spinType,
			resolve(){
				return {}
			}
		},
		application: {
			type: applicationType,
			args: {
				name: {
					type: GraphQLString
				}
			},
			resolve: (_, {name}) => getApplication(name)
		}
	}
});

let schema = new GraphQLSchema({
	 query: queryType
});

console.log("GraphQL server is up");
express()
		.use(cors())
		.use('/graphql', graphqlHTTP({schema: schema, pretty: true}))
		.listen(3000);

