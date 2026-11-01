class ApiResponse {
    constructor(statuscode, data, message="Success", hasMore, nextCursor){
        this.statuscode = statuscode
        this.data = data
        this.message = message
        this.success = statuscode < 400
        this.hasMore = hasMore
        this.nextCursor = nextCursor
    }
}

export { ApiResponse }