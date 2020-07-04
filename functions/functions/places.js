const firestore = require("firebase-admin");
const { firebaseConfig } = require("firebase-functions");

exports.getInfo = (request, response, database) => {
	console.log(request.params.id);
	database
		.collection("places")
		.doc(request.params.id)
		.get()
		.then((snapshot) => {
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
				const currentTime = new Date();
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
				response.status(200).send("Success");
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
	let responseMessage = "";
	if (!data.hasOwnProperty("name"))
		responseMessage += "'name' field is not found.\n";

	if (!data.hasOwnProperty("category"))
		responseMessage += "'category' field is not found.\n";

	if (!data.hasOwnProperty("location"))
		responseMessage += "'location' field is not found.\n";
	else {
		if (!data.location.hasOwnProperty("latitude"))
			responseMessage +=
				"'latitude' field in property 'location' is not found.\n";
		else if (typeof data.location.latitude !== "number")
			responseMessage += "'latitude' field must be a number.\n";
		if (!data.location.hasOwnProperty("longitude"))
			responseMessage +=
				"'longitude' field in property 'location' is not found.\n";
		else if (typeof data.location.longitude !== "number")
			responseMessage += "'longitude' field must be a number.\n";
	}
	if (!data.hasOwnProperty("capacity"))
		responseMessage += "'capacity' field is not found.\n";
	else if (typeof data.capacity !== "number")
		responseMessage += "'capacity' field must be a number.\n";

	if (responseMessage.length > 0) response.status(406).send(responseMessage); // If there's an error
	else {
		const dataToStore = {
			name: data.name.toString(),
			category: data.category.toString(),
			location: new firestore.firestore.GeoPoint(
				data.location.latitude,
				data.location.longitude
			),
			capacity: data.capacity,
			vistor_number: 0,
		};
		database.collection("places").add(dataToStore)
			.then(docRef => {
				response.status(200).send("Success\ndoc id: " + docRef.id.toString() + "\n" + JSON.stringify(dataToStore));
				return;
			})
			.catch(error => {
				console.log(error);
				response.status(500).send("500 Internal Server Error\n" + error.toString());
			})
	}
};
