export const DAYS_OF_WEEK_IN_ORDER = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
] as const

export const PrivateNavLinks = [
    {
        imgUrl: '/assets/events.svg',
        route: '/events',
        label: 'My Events',
    },
    {
        imgUrl: '/assets/schedule.svg',
        route: '/schedule',
        label: 'My Schedule',
    },
    {
        imgUrl: '/assets/public.svg',
        route: '/book',
        label: 'Public Profile',
    },
] as const