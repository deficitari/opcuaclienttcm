import * as mqtt from "mqtt"
import { MqttClient } from "mqtt";
import { DataValue } from "node-opcua";
import { Machine, Variable } from "./types/types";

/**
 * Agent IOT que utilitza protocol MQTT i publica canvis rebuts en l'escolta de l'objecte monitoredItem
 *
 * @export
 * @class MQTTAgent
 */
export class MQTTAgent {

    private mqttClient: MqttClient;

    constructor() {
        this.mqttClient = mqtt.connect('mqtt://mqtt.thethings.io')
    }

    /**
     *  Publica el valors que rebem del OPC-UA server al broker MQTT de la platforma IOT
     *
     * @param {Machine} machine La maquina que volem monitoritzar
     * @param {Variable} variable La varaible de la maquina
     * @param {DataValue} dataValue El valor que ha canviat i volem enviar
     * @memberof MQTTAgent
     */
    public publishMonitoredItemValueToIOTPlatorm(machine: Machine, variable: Variable, dataValue: DataValue): void {

        //Publiquem el valor amb el format que ens demana Thethings.io
        const values = { values: [{ key: variable.name, value: dataValue.value.value }] }
        this.mqttClient.publish(`v2/things/${machine.thingToken}`, JSON.stringify(values))

        /*TODO 4b: Publiquem fent servir el client d'MQTT amb la connexió ja establerta definida en aquesta mateixa classe, en el topic 
        * que ens demana thethings.io: 'v2/things/THING_TOKEN'
        */
    }
}
