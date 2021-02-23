// /auth GET page

module.exports = (req, res) => {
  return res.render('app/index', {
    page: 'app/index',
    title: 'Your Private Chat',
    includes: {
      external: {
        css: ['page', 'general', 'fontawesome', 'app'],
        js: ['page', 'serverRequest', 'socket.io']
      }
    },
    user: req.session.user
    // user: {
    //   _id: "1234",
    //   email: 'ygurlek22@my.uaa.k12.tr',
    //   name: 'Yunus Gürlek',
    //   details: '11A, 315',
    //   profile_photo: 'https://images.ruyandagor.com/2017/12/denizde-yunus-baligi-gormek-1332.jpg'
    // },
    // chat: {
    //   _id: "4321",
    //   email: 'stoy@my.uaa.k12.tr',
    //   name: 'Sedat Toy',
    //   details: 'Coğrafya Hocası',
    //   profile_photo: '/res/images/default/teacher.png',
    //   messages: [
    //     {
    //       content: "Merhaba hocam",
    //       read_by: [],
    //       sender_id: "1234",
    //       time: "18.36",
    //       day: "Yesterday"
    //     },
    //     {
    //       content: "Merhaba Yunus",
    //       read_by: [],
    //       sender_id: "4321",
    //       time: "19.07",
    //       day: "Yesterday"
    //     },
    //     {
    //       content: "Hocaaam",
    //       read_by: [],
    //       sender_id: "1234",
    //       time: "16:48",
    //       day: "Today"
    //     },
    //     {
    //       content: "Hocam mikrofonunuz kapalı, sizi duymuyoruz. Hocam mikrofonunuz kapalı, sizi duymuyoruz",
    //       read_by: [],
    //       sender_id: "1234",
    //       time: "16:49",
    //       day: "Today"
    //     }
    //   ]
    // },
    // latest_chats: [
    //   {
    //     _id: "8989",
    //     name: "Türker Teker",
    //     profile_photo: 'https://www.wbfturkey.com/doc/Istanbul%20Ligi/tteker.JPG',
    //     last_message: {
    //       content: "Yunus, I need to ask you something",
    //       sender_id: "8989",
    //       read_by: [],
    //       created_at: "16.50"
    //     },
    //     not_read_message_number: 1
    //   },
    //   {
    //     _id: "4321",
    //     name: "Sedat Toy",
    //     profile_photo: "/res/images/default/teacher.png",
    //     last_message: {
    //       content: "Hocam mikrofonunuz kapalı, sizi duymuyoruz",
    //       sender_id: "1234",
    //       read_by: [],
    //       created_at: "08.30"
    //     },
    //     not_read_message_number: 0
    //   },
    //   {
    //     _id: "4321",
    //     name: "Vide Gariç",
    //     profile_photo: "/res/images/default/teacher.png",
    //     last_message: {
    //       content: "Thank you a lot mr. Gariç :)",
    //       sender_id: "1234",
    //       read_by: ["4321"],
    //       created_at: "08.30"
    //     },
    //     not_read_message_number: 0
    //   }
    // ],
    // new_chats: [
    //   {
    //     _id: "1234",
    //     name: "Kimberly Byrd",
    //     email: "kbyrd@my.uaa.k12.tr",
    //     profile_photo: "/res/images/default/teacher.png"
    //   }
    // ]
  });
}
