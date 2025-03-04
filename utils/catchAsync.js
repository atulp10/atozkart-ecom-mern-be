export const catchAsync = (fn) => {
    return function (req, res, next) {
        fn(req, res, next).catch(e => {
            console.error("Async Error:", e);
            next(e);
        })
    }
}