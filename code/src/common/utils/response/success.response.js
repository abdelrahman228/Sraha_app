
export const successResponse = ({
        res,
        message = 'Done',
        status = 200,
        data = undefined
    } = {}) => {
    return res.status(status).json({status,msg:message, data })
}