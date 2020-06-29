exports.getInfo = (request,response,database) => {
    console.log(request.params.id);
    database.collection('places').doc(request.params.id).get()
    .then(snapshot => {
        if(!snapshot.exists) response.status(404).send("The requested place id is not found.");
        else response.status(200).send(snapshot.data());
        return 0;
    })
    .catch(error => {
        response.status(500).send(error);
    });
}