var level = require("level");

var db = level(
    "yunmai_weights.db", {
        valueEncoding: "json"
    }
);

db.createReadStream()
    .on("data", function (data) {
        console.log(
            data.value.createTime +
            ", " +
            data.value.weight +
            ", " +
            data.value.bmi +
            ", " +
            data.value.bmr +
            ", " +
            data.value.bone +
            ", " +
            data.value.fat +
            ", " +
            data.value.muscle +
            ", " +
            data.value.protein +
            ", " +
            data.value.resistance +
            ", " +
            data.value.somaAge +
            ", " +
            data.value.visFat +
            ", " +
            data.value.water +
            "\n"
        );
    })
    .on("close", function () {
        db.close();
    });