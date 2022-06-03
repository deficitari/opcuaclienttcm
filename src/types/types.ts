export type Machine = {
    name: string,
    thingToken: string,
    endpointURL: string,
    variables: Variable[]
}

export type Variable = {
    name: string,
    nodeId: number | string,
    sId: string
}