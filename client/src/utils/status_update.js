export const status_options = [
    {
        code: 25,
        title: "25%",
        update_visibility: true,
    },
    {
        code: 50,
        title: "50%",
        update_visibility: true,
    },
    {
        code: 75,
        title: "75%",
        update_visibility: true,
    },
    {
        code: 100,
        title: "100%",
        update_visibility: true,
    },
    {
        code: 200,
        title: "Completed",
        update_visibility: true,
    },
    {
        code: 300,
        title: "Scheduled",
        update_visibility: false,
    },
    {
        code: 310,
        title: "Pending",
        update_visibility: false,
    },
    {
        code: 311,
        title: "In Progress",
        update_visibility: false,
    },
    {
        code: 500,
        title: "Stuck",
        update_visibility: true,
    }
]

export const getReadableUpdateStatus = (status_code) => {
    const res = status_options.find((status) => status.code === status_code)
    return res.title
}