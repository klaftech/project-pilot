export const status_options = [
    {
        code: 25,
        title: "25%"
    },
    {
        code: 50,
        title: "50%"
    },
    {
        code: 75,
        title: "75%"
    },
    {
        code: 100,
        title: "100%"
    },
    {
        code: 200,
        title: "Completed"
    },
    {
        code: 500,
        title: "Stuck"
    }
]

export const getReadableUpdateStatus = (status_code) => {
    const res = status_options.find((status) => status.code === status_code)
    return res.title
}
