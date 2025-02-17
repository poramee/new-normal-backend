const firestore = require("firebase-admin");

exports.getInfo = (request, response, database) => {
	console.log(request.params.id);
	database
		.collection("places")
		.doc(request.params.id)
		.get()
		.then((snapshot) => {
			console.log(typeof snapshot.data());
			if (!snapshot.exists)
				response
					.status(404)
					.send({
						status: "404 Error",
						message: "The requested place id is not found.",
					});
			else
				response
					.status(200)
					.send({ status: "Success", message: snapshot.data() });
			return 0;
		})
		.catch((error) => {
			response
				.status(500)
				.send({ status: "500 Error", message: error.toString() });
		});
};

const recordActivity = async (request, response, database, type) => {
	await database
		.collection("places")
		.doc(request.params.id)
		.get()
		.then(async (snapshot) => {
			if (snapshot.exists) {
				const data = snapshot.data();
				const currentTime = new Date();
				if (data.visitor_number <= 0 && type === "exit") {
					response
						.status(406)
						.send({
							status: "404 Error",
							message: "Current capacity is now 0",
						});
				}

				await database
					.collection("places")
					.doc(
						request.params.id +
							"/visitor_log/" +
							currentTime.getTime().toString() +
							"_" +
							type
					)
					.set({
						date: firestore.firestore.Timestamp.fromDate(currentTime),
						type: type,
					});
				await database
					.collection("places")
					.doc(request.params.id)
					.update({
						visitor_number: firestore.firestore.FieldValue.increment(
							type === "exit" ? -1 : 1
						),
					});
				response.status(200).send({status: "Success", message: null});
			} else {
				response
					.status(404)
					.send({
						status: "404 Error",
						message: "The requested place id is not found.",
					});
			}
			return null;
		})
		.catch((error) => {
			console.log(error);
			response
				.status(500)
				.send({ status: "500 Error", message: error.toString() });
		});
};

exports.recordPersonEntrance = async (request, response, database) => {
	await recordActivity(request, response, database, "entrance");
};
exports.recordPersonExit = async (request, response, database) => {
	await recordActivity(request, response, database, "exit");
};
exports.createNewPlace = async (request, response, database) => {
	const data = request.body;
	let responseMessage = [];
	if (!data.hasOwnProperty("name"))
		responseMessage.push("'name' field is not found.");

	if (!data.hasOwnProperty("category"))
		responseMessage.push("'category' field is not found.");

	if (!data.hasOwnProperty("coordinates"))
		responseMessage.push("'coordinates' field is not found.");
	else {
		if (!data.coordinates.hasOwnProperty("latitude"))
			responseMessage.push(
				"'latitude' field in property 'coordinates' is not found."
			);
		else if (typeof data.coordinates.latitude !== "number")
			responseMessage.push("'latitude' field must be a number.");
		if (!data.coordinates.hasOwnProperty("longitude"))
			responseMessage.push(
				"'longitude' field in property 'coordinates' is not found."
			);
		else if (typeof data.coordinates.longitude !== "number")
			responseMessage.push("'longitude' field must be a number.");
	}
	if (!data.hasOwnProperty("capacity"))
		responseMessage.push("'capacity' field is not found.");
	else if (typeof data.capacity !== "number")
		responseMessage.push("'capacity' field must be a number.");

	if (responseMessage.length > 0)
		response
			.status(406)
			.send({ status: "406 Error", message: responseMessage });
	// If there's an error
	else {
		try {
			const dataToStore = {
				name: data.name.toString(),
				category: data.category.toString(),
				coordinates: new firestore.firestore.GeoPoint(
					data.coordinates.latitude,
					data.coordinates.longitude
				),
				capacity: data.capacity,
				visitor_number: 0,
			};
			database
				.collection("places")
				.add(dataToStore)
				.then((docRef) => {
					const responseToSend = {
						status: "Success",
						message: {
							documentID: docRef.id.toString(),
							storedData: dataToStore,
						},
					};
					response.status(200).send(responseToSend);
					return null;
				})
				.catch((error) => {
					const responseToSend = {
						status: "Error 500",
						message: error.toString(),
					};
					console.log(error);
					response.status(500).send(responseToSend);
				});
		} catch (error) {
			response
				.status(406)
				.send({ status: "406 Error", message: error.toString() });
		}
	}
};

exports.getNearbyPlaces = async (request, response, database) => {
	const placeCollection = database.collection('places');
	const query = placeCollection.near({
		center: new firestore.firestore.GeoPoint(
			parseFloat(request.query.lat),
			parseFloat(request.query.long)
		),
		radius: 1,
	});

	query.get().then((value) => {
		console.log(value);
		response.status(200).send({status: "Success", message: value});
		return null;
	})
		.catch(error => {
			console.log(error);
			response.status(500).send({status: "500 Error", message: error});
		})
};

exports.getPlaceByCategory = async (request, response, database) => {
	let placeRef = database.collection("places");
	const category = request.params.category;
	let query = placeRef.where("category", "==", category);
	await query.get()
		.then(queryResult => {
			console.log(queryResult);
			response.status(200).send({status: "Success", message: queryResult});
			return null;
		})
		.catch(error => {
			response.status(500).send({status: "500 Error", message: error});
		})
}

exports.searchPlaces = async (request,response, database) => {
	let placeRef = database.collection("places");
	const textToQuery = request.query.query;
	let query = placeRef.where("name", ">=", textToQuery).where("name","<=",textToQuery + '\uf8ff');
	await query.get()
		.then(queryResult => {
			console.log(queryResult);
			response.status(200).send({status: "Success", message: queryResult});
			return null;
		})
		.catch(error => {
			response.status(500).send({status: "500 Error", message: error});
		})
}