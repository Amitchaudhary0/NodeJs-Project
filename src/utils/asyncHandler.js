// =========================================================================================
//                          Using Promise async handler
// =========================================================================================

const asyncHandler=(handlerFuntion)=>{
    (req, res, next)=>{
        Promise.resolve(handlerFuntion(req, res, next)).catch((err)=>{
            next(err);
        })
    }
}



// =========================================================================================
//                          Using Try Catch async handler
// =========================================================================================

// const asyncHandler =(handlerFuntion)=>async (req, res, next)=>{
//     try {
//         await handlerFuntion(req, res, next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success:false,
//             message: error.message
//         });
//     }
// }

