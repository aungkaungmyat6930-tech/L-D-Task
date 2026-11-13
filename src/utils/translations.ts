export type Language = 'my' | 'en';

export const TRANSLATIONS = {
  en: {
    brandName: 'KBZ Life Insurance',
    subBrand: 'L&D Task & Work Portal',
    portalTagline: 'Learning & Development Task & Work Management Solution',
    activeUserContext: 'Active User:',
    editProfile: 'Edit My Profile',
    switchUser: 'Switch User',
    superAdminBadge: 'Super Admin',
    adminBadge: 'Admin',
    memberBadge: 'Member',
    viewerBadge: 'Viewer (Read-Only)',
    orgChart: 'Workflow Org-Chart',
    resetData: 'Reset Demo Data',
    
    // Tabs
    tabDirectory: 'Team Directory & Sheets',
    tabWeekly: 'Weekly Board',
    tabTasks: 'Task Management',
    tabLeave: 'Leave Requests',
    tabTraining: 'Training Hours',
    tabProjects: 'Strategic Projects',

    // Metrics
    metricActiveTasks: 'Active Tasks',
    metricActiveTasksSub: 'In progress or waiting',
    metricOverdue: 'Overdue Tasks',
    metricOverdueSub: 'Due date passed',
    metricPendingLeaves: 'Pending Leaves',
    metricPendingLeavesSub: 'Awaiting admin review',
    metricTotalHours: 'Total Training Hours',
    metricTotalHoursSub: 'Accumulated across team',

    // Self-Service & Controls
    myRecordsOnly: 'My Items Only',
    allRecords: 'All Records',
    addMyTask: 'Add New Task',
    addMyLeave: 'Submit Leave',
    addMyTraining: 'Log Training',
    edit: 'Edit',
    delete: 'Delete',
    comments: 'Comments',
    openSheet: 'Open Full Sheet',
    myPersonalSheet: 'Your Personal Sheet (Full Control)',
    readOnlySheet: 'Viewing Member Sheet',

    // Statuses
    inProgress: 'In Progress',
    waiting: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    overdue: 'Overdue',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',

    // Modals
    editProfileTitle: 'Edit My Profile & Name',
    editProfileDesc: 'Change your display name, designation, and department. Changes will automatically update across all your tasks, leaves, and training logs.',
    fullName: 'Full Name',
    jobTitle: 'Job Title / Designation',
    department: 'Department / Channel',
    avatarUrl: 'Avatar Image URL',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',

    // Task modal
    taskTitle: 'Task Title',
    assignee: 'Assignee / Owner',
    dueDate: 'Due Date',
    nextFollowup: 'Next Follow-up Date',
    status: 'Status',
    note: 'Follow-up Notes / Progress Details',
    saveTask: 'Save Task',

    // Leave modal
    leaveType: 'Leave Type',
    startDate: 'Start Date',
    endDate: 'End Date',
    durationDays: 'Duration (Days)',
    reason: 'Reason for Leave',
    submitLeave: 'Submit Leave Request',
    adminApproval: 'Admin Approval',
    approve: 'Approve',
    reject: 'Reject',

    // Training modal
    sessionName: 'Training Session / Course Name',
    trainingDate: 'Training Date',
    startTime: 'Start Time',
    endTime: 'End Time',
    breakHours: 'Break Duration (Hours)',
    calculatedHours: 'Calculated Training Hours',
    formulaNote: 'Formula: (End Time - Start Time) - Break Time',
    attendees: 'Co-Trainer (Team Members)',
    coTrainer: 'Co-Trainer',
    editedBy: 'Last Edited By',
    trainerName: 'Trainer / Facilitator',
    saveTraining: 'Save Training Log',

    // Comments modal
    commentsTitle: 'Task Activity & Comment Thread',
    writeComment: 'Write a comment or progress update...',
    post: 'Post Comment',
    noComments: 'No comments yet. Write the first update below.',
  },
  my: {
    brandName: 'ကမ္ဘောဇ အသက်အာမခံ',
    subBrand: 'L&D လုပ်ငန်းစီမံခန့်ခွဲမှု ပေါ်တယ်',
    portalTagline: 'လေ့ကျင့်ရေးနှင့် လူ့စွမ်းအားဖွံ့ဖြိုးရေး (L&D) လုပ်ငန်းတာဝန်များ၊ ခွင့်ရက်နှင့် သင်တန်းနာရီ စီမံမှုစနစ်',
    activeUserContext: 'လက်ရှိအသုံးပြုသူ -',
    editProfile: 'မိမိနာမည်/ပရိုဖိုင် ပြင်ဆင်ရန်',
    switchUser: 'အကောင့်ပြောင်းရန်',
    superAdminBadge: 'စူပါစီမံခန့်ခွဲသူ (Super Admin)',
    adminBadge: 'စီမံခန့်ခွဲသူ (Admin)',
    memberBadge: 'အဖွဲ့ဝင် (Member)',
    viewerBadge: 'ကြည့်ရှုသူ (Viewer)',
    orgChart: 'လုပ်ငန်းစဉ်ပြဇယား (Org-Chart)',
    resetData: 'မူလဒေတာ ပြန်ထားရန်',

    // Tabs
    tabDirectory: 'အဖွဲ့ဝင်များနှင့် ကိုယ်ပိုင်မှတ်တမ်းများ',
    tabWeekly: 'အပတ်စဉ် လုပ်ငန်းခွင်ဇယား (Weekly Board)',
    tabTasks: 'လုပ်ငန်းတာဝန်များ (Tasks)',
    tabLeave: 'ခွင့်ရက်မှတ်တမ်းများ (Leaves)',
    tabTraining: 'သင်တန်းနာရီများ (Training Hours)',
    tabProjects: 'အဓိကစီမံကိန်းများ (Projects)',

    // Metrics
    metricActiveTasks: 'လက်ရှိလုပ်ဆောင်ဆဲ Task များ',
    metricActiveTasksSub: 'လုပ်ဆောင်ဆဲ သို့မဟုတ် စောင့်ဆိုင်းဆဲ',
    metricOverdue: 'ရက်ကျော်လွန်နေသော Task များ',
    metricOverdueSub: 'သတ်မှတ်ရက် ကျော်လွန်သွားသည်',
    metricPendingLeaves: 'အတည်ပြုရန်စောင့်ဆိုင်းဆဲ ခွင့်များ',
    metricPendingLeavesSub: 'Admin စိစစ်ဆဲ',
    metricTotalHours: 'စုစုပေါင်း သင်တန်းနာရီ',
    metricTotalHoursSub: 'အဖွဲ့ဝင်အားလုံး စုစည်းရရှိမှု',

    // Self-Service & Controls
    myRecordsOnly: 'ကိုယ့်အတွက်သာ ကြည့်ရန်',
    allRecords: 'အားလုံးကြည့်ရန်',
    addMyTask: 'Task အသစ်ထည့်ရန်',
    addMyLeave: 'ခွင့်တောင်းခံလွှာ တင်ရန်',
    addMyTraining: 'သင်တန်းနာရီ မှတ်တမ်းတင်ရန်',
    edit: 'ပြင်ဆင်ရန်',
    delete: 'ဖျက်ရန်',
    comments: 'မှတ်ချက်များ',
    openSheet: 'အသေးစိတ် Sheet ဖွင့်ရန်',
    myPersonalSheet: 'သင့်ကိုယ်ပိုင် မှတ်တမ်း (စိတ်ကြိုက် ပြင်/ဖျက်နိုင်သည်)',
    readOnlySheet: 'အဖွဲ့ဝင်မှတ်တမ်း ကြည့်ရှုနေသည်',

    // Statuses
    inProgress: 'လုပ်ဆောင်ဆဲ (In Progress)',
    waiting: 'စောင့်ဆိုင်းဆဲ (Pending)',
    completed: 'ပြီးစီး (Completed)',
    cancelled: 'ပယ်ဖျက်',
    overdue: 'ရက်ကျော်လွန်',
    pending: 'စောင့်ဆိုင်းဆဲ (Pending)',
    approved: 'အတည်ပြုပြီး',
    rejected: 'ငြင်းပယ်ထား',

    // Modals
    editProfileTitle: 'မိမိနာမည်နှင့် ကိုယ်ရေးအချက်အလက် ပြင်ဆင်ရန်',
    editProfileDesc: 'မိမိ၏ အမည်၊ ရာထူးနှင့် ဌာနတို့ကို စိတ်ကြိုက် ပြောင်းလဲနိုင်ပါသည်။ ပြောင်းလဲလိုက်သော အမည်သည် သင့် Task များ၊ ခွင့်ရက်များနှင့် သင်တန်းမှတ်တမ်းများ အားလုံးတွင် အလိုအလျောက် ပြောင်းလဲသွားပါမည်။',
    fullName: 'အမည် (Full Name)',
    jobTitle: 'ရာထူး / တာဝန်',
    department: 'ဌာန / ကဏ္ဍ',
    avatarUrl: 'ဓာတ်ပုံ URL (Avatar Image)',
    saveChanges: 'အပြောင်းအလဲများ သိမ်းဆည်းရန်',
    cancel: 'မလုပ်တော့ပါ',

    // Task modal
    taskTitle: 'လုပ်ငန်းတာဝန် အမည် (Task Title)',
    assignee: 'တာဝန်ယူသူ (Assignee)',
    dueDate: 'ပြီးစီးရမည့်ရက် (Due Date)',
    nextFollowup: 'နောက်တစ်ကြိမ် တွန်းအားပေးမည့်ရက် (Follow-up Date)',
    status: 'အခြေအနေ (Status)',
    note: 'တိုးတက်မှုမှတ်စု / နောက်လုပ်ဆောင်ချက်',
    saveTask: 'Task သိမ်းဆည်းရန်',

    // Leave modal
    leaveType: 'ခွင့်အမျိုးအစား (Leave Type)',
    startDate: 'စတင်သည့်ရက်',
    endDate: 'ပြီးဆုံးသည့်ရက်',
    durationDays: 'ခွင့်ရက်အရေအတွက် (ရက်)',
    reason: 'ခွင့်ယူရသည့် အကြောင်းအရင်း',
    submitLeave: 'ခွင့်တောင်းခံလွှာ တင်သွင်းရန်',
    adminApproval: 'စီမံခန့်ခွဲသူ ခွင့်ပြုချက်',
    approve: 'ခွင့်ပြုသည်',
    reject: 'ငြင်းပယ်သည်',

    // Training modal
    sessionName: 'သင်တန်းခေါင်းစဉ် / အမည်',
    trainingDate: 'သင်တန်းပြုလုပ်သည့်ရက်',
    startTime: 'စတင်ချိန်',
    endTime: 'ပြီးဆုံးချိန်',
    breakHours: 'အနားယူချိန် နာရီ (Break Hours)',
    calculatedHours: 'တွက်ချက်ရရှိသော သင်တန်းနာရီ',
    formulaNote: 'တွက်ချက်ပုံသေနည်း - (ပြီးဆုံးချိန် - စတင်ချိန်) - အနားယူချိန်',
    attendees: 'တွဲဖက်သင်တန်းဆရာ (Co-Trainer)',
    coTrainer: 'တွဲဖက်သင်တန်းဆရာ (Co-Trainer)',
    editedBy: 'ပြင်ဆင်သူ',
    trainerName: 'သင်တန်းဆရာ / Facilitator',
    saveTraining: 'သင်တန်းမှတ်တမ်း သိမ်းဆည်းရန်',

    // Comments modal
    commentsTitle: 'Task တိုးတက်မှုနှင့် မှတ်ချက်များ (Comments & Notes)',
    writeComment: 'မှတ်ချက် သို့မဟုတ် တိုးတက်မှု အခြေအနေ ရေးသားပါ...',
    post: 'မှတ်ချက် တင်ရန်',
    noComments: 'မှတ်ချက် မရှိသေးပါ။ ပထမဆုံးမှတ်ချက်ကို အောက်တွင် ရေးသားနိုင်ပါသည်။',
  },
};
