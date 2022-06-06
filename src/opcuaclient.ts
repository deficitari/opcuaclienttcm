
import {
    OPCUAClient,
    MessageSecurityMode,
    SecurityPolicy,
    AttributeIds,
    ClientSubscription,
    TimestampsToReturn,
    MonitoringParametersOptions,
    ClientMonitoredItem,
    DataValue
} from "node-opcua";
import { Machine, Variable } from "./types/types";
import { MQTTAgent } from './mqttagent'

// TODO1: Posar la Url del servidor que s'especifica en el PDF de la pràctica
const endpointUrl = 'URL_ENDPOINT'

// TODO2: Afegir les dos varaibles que volem monitoritzar que previament hem vist i els seus nodeIds que veiem en el PROSYS Browser
const sharedVariables: Variable[] = [
    { name: 'example1', nodeId: 'ns=4;b=6666TTTT' },
    { name: 'example2', nodeId: 'ns=2;b=8888YYYY' },
]

// TODO3: Afegir el thingToken del dispositiu creat a la plataforma IOT thethings.io
const machine: Machine = { name: 'Heller CE460X1000', endpointURL: endpointUrl, thingToken: 'XXXXXXXXXXXXXXXXXXXXXX', variables: sharedVariables }

// Inicialització del agent MQTT que més tard farem servir
const agentMQTT = new MQTTAgent()

// Creació del client OPC-UA amb una configuració bàsica sense seguretat
const client: OPCUAClient = OPCUAClient.create({
    applicationName: "Client" + (Math.random() + 1).toString(36).substring(7),
    connectionStrategy: {
        initialDelay: 1000,
        maxRetry: 10
    },
    securityMode: MessageSecurityMode.None,
    securityPolicy: SecurityPolicy.None,
    endpointMustExist: false,
    keepSessionAlive: true,
});

async function main() {
    try {
        // Establir conexió amb el servidor
        await client.connect(endpointUrl);
        console.log("Connected to server!");

        // Crear una sessió amb el servidor
        const session = await client.createSession();
        console.log("Session created!");

        // Preparar una subscripció en el servidor
        const subscription = ClientSubscription.create(session, {
            requestedPublishingInterval: 1000,
            requestedLifetimeCount: 100,
            requestedMaxKeepAliveCount: 10,
            maxNotificationsPerPublish: 100,
            publishingEnabled: true,
            priority: 10
        });

        subscription
            .on("started", function () {
                console.log(
                    "Subscription started - subscriptionId=",
                    subscription.subscriptionId
                );
            })
            .on("keepalive", function () {
                console.log("keepalive");
            })
            .on("terminated", function () {
                console.log("terminated");
            });


        //Preparem els parametres de monotorització de les variables que volem llegir. Llegirem cada 500 milisegons
        const parameters: MonitoringParametersOptions = {
            samplingInterval: 500,
            discardOldest: true,
            queueSize: 10
        };

        machine.variables.map(async (variable: Variable) => {

            // Creem el objecte que volem monitoritzar especificant el seu identificador de node
            const itemToMonitor: any = {
                nodeId: variable.nodeId, //'ns=3;i=1001', 
                attributeId: AttributeIds.Value
            };

            // Agafant l'objecte subscripció creat anteriorment i el node que volem monotoritzar es crea un objecte 'ClientMonitoredItem' que emetrà events
            const monitoredItem = ClientMonitoredItem.create(
                subscription,
                itemToMonitor,
                parameters,
                TimestampsToReturn.Both
            );

            // S'afegeix la funció d'escolta per a l'esdeveniment anomenat changed, que detecta quan canvia una varaible de la maquina
            monitoredItem.on("changed", (dataValue: DataValue) => {
                console.log("Value has changed : ", dataValue.value.toString());

                /*TODO 4a: Quan rebem un canvi de la varaible monotoritzada, hem de fer una publicació fent servir el protocol mqtt cap
                al el broker de thethings.io */

            });

            monitoredItem.on("err", (err_message: string) => {
                console.log(monitoredItem.itemToMonitor.nodeId.toString(), console.log('Error: '), err_message);
            });

        })

    } catch (err) {
        if (err instanceof Error) {
            console.log("An error has occurred : ", err);
        }
    }
}

// Entrada principal d'execució del client opc-ua
main();