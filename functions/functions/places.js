const firestore = require("firebase-admin");
const { firebaseConfig } = require("firebase-functions");

exports.getInfo = (request, response, database) => {
	console.log(request.params.id);
	database
		.collection("places")
		.doc(request.params.id)
		.get()
		.then((snapshot) => {
			console.log(typeof snapshot.data());
			if (!snapshot.exists)
				response.status(404).send("The requested place id is not found.");
			else response.status(200).send(snapshot.data());
			return 0;
		})
		.catch((error) => {
			response.status(500).send(error);
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
					const responseToSend = {
						status: "406 Error",
						message: "Current capacity is now 0",
					};
					response.status(406).send(responseToSend);
					return;
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
				const responseToSend = {
					status: "Success",
					message: null,
				};
				response.status(200).send(responseToSend);
			} else response.status(404).send("The requested place id is not found.");
			return;
		})
		.catch((error) => {
			console.log(error);
			response.status(500).send(error.toString());
		});
};

exports.recordPersonEntrance = async (request, response, database) => {
	recordActivity(request, response, database, "entrance");
};
exports.recordPersonExit = async (request, response, database) => {
	recordActivity(request, response, database, "exit");
};
exports.createNewPlace = async (request, response, database) => {
	const data = request.body;
	let responseMessage = [];
	if (!data.hasOwnProperty("name"))
		responseMessage.push("'name' field is not found.");

	if (!data.hasOwnProperty("category"))
		responseMessage.push("'category' field is not found.");

	if (!data.hasOwnProperty("location"))
		responseMessage.push("'location' field is not found.");
	else {
		if (!data.location.hasOwnProperty("latitude"))
			responseMessage.push(
				"'latitude' field in property 'location' is not found."
			);
		else if (typeof data.location.latitude !== "number")
			responseMessage.push("'latitude' field must be a number.");
		if (!data.location.hasOwnProperty("longitude"))
			responseMessage.push(
				"'longitude' field in property 'location' is not found."
			);
		else if (typeof data.location.longitude !== "number")
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
		try{
			const dataToStore = {
			name: data.name.toString(),
			category: data.category.toString(),
			location: new firestore.firestore.GeoPoint(
				data.location.latitude,
				data.location.longitude
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
				return;
			})
			.catch((error) => {
				const responseToSend = {
					status: "Error 500",
					message: error.toString(),
				};
				console.log(error);
				response.status(500).send(responseToSend);
			});
		} catch (error){
			response.status(406).send({status: "406 Error",message: error.toString()})
		}
		
	}
};
