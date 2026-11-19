import type { Exam, PictureOption } from '../types/exam';

const BUILTIN_PICTURE_KEYS = new Set([
  'q1_a', 'q1_b', 'q1_c',
  'q2_a', 'q2_b', 'q2_c',
  'q3_a', 'q3_b', 'q3_c',
  'q4_a', 'q4_b', 'q4_c',
  'q5_a', 'q5_b', 'q5_c',
]);

export function resolvePictureSrc(opt: PictureOption): string {
  if (opt.imageUrl) return opt.imageUrl;
  if (opt.svgKey && (opt.svgKey.startsWith('data:') || opt.svgKey.startsWith('/') || opt.svgKey.startsWith('http'))) {
    return opt.svgKey;
  }
  if (opt.svgKey && BUILTIN_PICTURE_KEYS.has(opt.svgKey)) {
    return `${import.meta.env.BASE_URL}assets/ha1-pictures/${opt.svgKey}.jpg`;
  }
  return '';
}

export const EXAM_BANK: Exam[] = [
  {
    id: 'ha1-midterm-sample-01',
    code: 'HA1-MT01',
    title: 'Đề Minh Họa HA1 — Midterm Sample Test 01',
    subtitle: 'Giáo trình HA1 (Trang 206–211) · Đầy đủ 3 kỹ năng Nghe - Đọc - Viết',
    totalDurationMin: 50,
    tags: ['Giữa kỳ HA1', '40 câu hỏi', 'Có Audio TTS + MP3'],
    sections: [
      /* -------------------- SECTION 1: LISTENING (15 câu) -------------------- */
      {
        id: 'listening',
        title: 'Listening',
        viTitle: 'Kỹ năng Nghe',
        durationMin: 15,
        icon: 'headphones',
        description:
          'Gồm 2 phần: Part 1 (5 câu hội thoại ngắn chọn tranh A/B/C) và Part 2 (10 câu hội thoại chọn đáp án A/B/C/D). Mỗi câu nghe 2 lần.',
        parts: [
          {
            id: 'l-p1',
            title: 'Part 1: Short Conversations with Pictures (Questions 1–5)',
            instruction:
              'You will hear five short conversations. You will hear each conversation twice. Choose the right picture (A, B or C).',
            questions: [
              {
                id: 'L1',
                num: 1,
                type: 'picture_mcq',
                prompt: "What's Sue doing?",
                options: [
                  { label: 'A', text: 'Playing basketball outside', svgKey: 'q1_a' },
                  { label: 'B', text: 'Reading a book at her desk', svgKey: 'q1_b' },
                  { label: 'C', text: 'Sleeping at her desk', svgKey: 'q1_c' },
                ],
                answer: 1,
                ttsDialogue: [
                  { role: 'male', text: "Where's Sue? Is she playing basketball with the girls outside?" },
                  { role: 'female', text: "No, she isn't. She's in the classroom." },
                  { role: 'male', text: 'Oh, is she sleeping at her desk again?' },
                  { role: 'female', text: "No, look! She's sitting at her desk and reading a book." },
                ],
                evidence: "No, look! She's sitting at her desk and reading a book.",
                explanation:
                  'Bạn nữ phủ nhận cả hai phương án bẫy (chơi bóng rổ ngoài sân — A; ngủ gục trên bàn — C) và khẳng định Sue đang ngồi đọc sách tại bàn học (B).',
              },
              {
                id: 'L2',
                num: 2,
                type: 'picture_mcq',
                prompt: 'Where are the children?',
                options: [
                  { label: 'A', text: 'Singing in the music room', svgKey: 'q2_a' },
                  { label: 'B', text: 'In the classroom ("The cat is black")', svgKey: 'q2_b' },
                  { label: 'C', text: 'Watching TV at home', svgKey: 'q2_c' },
                ],
                answer: 1,
                ttsDialogue: [
                  { role: 'female', text: 'Are the children at home watching television?' },
                  { role: 'male', text: "No, they're at school now." },
                  { role: 'female', text: 'Oh, are they singing in the music room?' },
                  {
                    role: 'male',
                    text: "Not right now. They're in their classroom, looking at the sentence 'The cat is black' on the board.",
                  },
                ],
                evidence:
                  "They're in their classroom, looking at the sentence 'The cat is black' on the board.",
                explanation:
                  "Bọn trẻ không ở nhà xem TV (C) và cũng không ở phòng hát (A), mà đang ở trong lớp học nhìn câu 'The cat is black' trên bảng (B).",
              },
              {
                id: 'L3',
                num: 3,
                type: 'picture_mcq',
                prompt: "What's the teacher doing?",
                options: [
                  { label: 'A', text: 'Writing "a b c" on the board', svgKey: 'q3_a' },
                  { label: 'B', text: 'Drawing a boat (female teacher)', svgKey: 'q3_b' },
                  { label: 'C', text: 'Drawing shapes (triangle & circle)', svgKey: 'q3_c' },
                ],
                answer: 1,
                ttsDialogue: [
                  { role: 'male', text: "Look at the board! What's our teacher doing today?" },
                  { role: 'female', text: 'Is he writing the letters A, B, C?' },
                  {
                    role: 'male',
                    text: "No, that was yesterday. Today we have a female teacher, and she's drawing a boat on the board.",
                  },
                  {
                    role: 'female',
                    text: 'Oh yes! I thought she was drawing shapes like a triangle and a circle!',
                  },
                ],
                evidence: "Today we have a female teacher, and she's drawing a boat on the board.",
                explanation:
                  'Viết chữ a b c là việc của hôm qua (A), vẽ hình tam giác/tròn chỉ là phỏng đoán sai (C). Đáp án đúng là cô giáo đang vẽ chiếc thuyền trên bảng (B).',
              },
              {
                id: 'L4',
                num: 4,
                type: 'picture_mcq',
                prompt: 'What are the girls eating?',
                options: [
                  { label: 'A', text: 'Sandwiches', svgKey: 'q4_a' },
                  { label: 'B', text: 'Bananas', svgKey: 'q4_b' },
                  { label: 'C', text: 'Apples', svgKey: 'q4_c' },
                ],
                answer: 2,
                ttsDialogue: [
                  { role: 'male', text: 'What are the two girls eating in the kitchen? Sandwiches?' },
                  { role: 'female', text: 'No, they finished their sandwiches earlier.' },
                  { role: 'male', text: 'Are they eating bananas then?' },
                  { role: 'female', text: "No, they're eating red apples. Look at them!" },
                ],
                evidence: "No, they're eating red apples. Look at them!",
                explanation:
                  'Hai bạn nữ đã ăn xong bánh mì kẹp từ trước (A) và không ăn chuối (B); hiện tại họ đang ăn táo (C).',
              },
              {
                id: 'L5',
                num: 5,
                type: 'picture_mcq',
                prompt: 'What game are the boys playing?',
                options: [
                  { label: 'A', text: 'Toy cars', svgKey: 'q5_a' },
                  { label: 'B', text: 'Robots', svgKey: 'q5_b' },
                  { label: 'C', text: 'Computer game', svgKey: 'q5_c' },
                ],
                answer: 2,
                ttsDialogue: [
                  {
                    role: 'female',
                    text: 'What are the boys doing in the living room? Are they playing with their toy cars?',
                  },
                  { role: 'male', text: 'No, those cars are on the shelf.' },
                  { role: 'female', text: 'Then are they playing with robots on the floor?' },
                  {
                    role: 'male',
                    text: "No, they're sitting at the desk and playing a computer game together.",
                  },
                ],
                evidence: "No, they're sitting at the desk and playing a computer game together.",
                explanation:
                  'Ô tô đồ chơi đang để trên kệ (A), không chơi rô-bốt (B). Hai cậu bé đang ngồi ở bàn chơi trò chơi máy tính (C).',
              },
            ],
          },
          {
            id: 'l-p2',
            title: 'Part 2: Conversations — Multiple Choice (Questions 6–15)',
            instruction:
              'You will hear 10 conversations (trùng khớp 100% với tệp gốc Unit 2- Part B.mp3). Listen to each twice and choose the best answer.',
            supportsLocalAudio: true,
            questions: [
              {
                id: 'L6',
                num: 6,
                type: 'mcq',
                prompt: "Where is Sasha's mother from?",
                options: ['The United Kingdom', 'The United States', 'Ukraine', 'Russia'],
                answer: 2,
                ttsDialogue: [
                  {
                    role: 'female',
                    text: "Hi, I'm Sasha. I live in the UK now, but my mother is from Ukraine, and she makes great yogurt.",
                  },
                ],
                evidence: 'My mother is from Ukraine, and she makes great yogurt.',
                explanation: 'Sasha nói rõ mẹ cô ấy đến từ Ukraine (C). UK là nơi hiện tại đang sống (bẫy A).',
              },
              {
                id: 'L7',
                num: 7,
                type: 'mcq',
                prompt: "Which is Sasha's favourite food?",
                options: ['strawberries', 'tomatoes', 'yoghurt', 'avocadoes'],
                answer: 2,
                ttsDialogue: [
                  {
                    role: 'female',
                    text: 'My favourite food is yoghurt. I eat it almost every morning with fruit.',
                  },
                ],
                evidence: 'My favourite food is yoghurt.',
                explanation: 'Món ăn yêu thích nhất của Sasha là sữa chua — yoghurt (C).',
              },
              {
                id: 'L8',
                num: 8,
                type: 'mcq',
                prompt: 'What does Mark eat for breakfast every day?',
                options: ['cheese', 'salmon', 'chicken', 'bananas'],
                answer: 3,
                ttsDialogue: [
                  {
                    role: 'male',
                    text: "Hello, I'm Mark. I try to eat healthy food. I have a banana for breakfast every day.",
                  },
                ],
                evidence: 'I have a banana for breakfast every day.',
                explanation: 'Mark ăn chuối (bananas — D) cho bữa sáng mỗi ngày.',
              },
              {
                id: 'L9',
                num: 9,
                type: 'mcq',
                prompt: 'Which food does Mark mention?',
                options: ['broccoli', 'carrots', 'yoghurt', 'mushroom'],
                answer: 0,
                ttsDialogue: [
                  {
                    role: 'male',
                    text: 'For dinner I usually eat vegetables with fish or meat. And I also love broccoli and potatoes.',
                  },
                ],
                evidence: 'And I also love broccoli and potatoes.',
                explanation: 'Trong 4 lựa chọn, Mark chỉ nhắc đến bông cải xanh — broccoli (A).',
              },
              {
                id: 'L10',
                num: 10,
                type: 'mcq',
                prompt: 'Where is Lynn from?',
                options: ['The USA', 'Australia', 'Austria', 'Korea'],
                answer: 1,
                ttsDialogue: [
                  {
                    role: 'female',
                    text: "Hi, my name's Lynn. I'm from Australia, and I love fresh salads and fruit.",
                  },
                ],
                evidence: "I'm from Australia.",
                explanation:
                  'Lynn đến từ Úc — Australia (B). Chú ý phân biệt phát âm giữa Australia (B) và Austria (C).',
              },
              {
                id: 'L11',
                num: 11,
                type: 'mcq',
                prompt: 'Which food does Lynn NOT talk about?',
                options: ['lettuce', 'tomatoes', 'strawberries', 'mushroom'],
                answer: 3,
                ttsDialogue: [
                  {
                    role: 'female',
                    text: 'I eat a lot of lettuce, tomatoes, rice, avocados, and strawberries every week.',
                  },
                ],
                evidence: 'I eat a lot of lettuce, tomatoes, rice, avocados, and strawberries.',
                explanation:
                  'Lynn nhắc đến lettuce (A), tomatoes (B), strawberries (C), và KHÔNG nhắc đến mushroom (D).',
              },
              {
                id: 'L12',
                num: 12,
                type: 'mcq',
                prompt: 'When is the Winter Carnival held?',
                options: ['in January', 'in February', 'in November', 'in December'],
                answer: 0,
                ttsDialogue: [
                  {
                    role: 'male',
                    text: 'Every winter we have a big Winter Carnival. It happens in Quebec in January.',
                  },
                ],
                evidence: 'It happens in Quebec in January.',
                explanation: 'Lễ hội mùa đông (Winter Carnival) diễn ra vào tháng Một — in January (A).',
              },
              {
                id: 'L13',
                num: 13,
                type: 'mcq',
                prompt: 'Where does the canoe race take place?',
                options: ['on the road', 'on the lake', 'on the river', 'in the sea'],
                answer: 2,
                ttsDialogue: [
                  {
                    role: 'male',
                    text: 'There are many exciting events, and I enjoy watching the canoe race on the river.',
                  },
                ],
                evidence: 'I enjoy watching the canoe race on the river.',
                explanation: 'Cuộc đua xuồng (canoe race) diễn ra trên sông — on the river (C).',
              },
              {
                id: 'L14',
                num: 14,
                type: 'mcq',
                prompt: 'How long does the Carnival last?',
                options: ['two days', 'less than ten days', 'ten days', 'a few days'],
                answer: 2,
                ttsDialogue: [
                  {
                    role: 'male',
                    text: 'The carnival lasts ten days, so visitors have plenty of time to enjoy the snow sculptures.',
                  },
                ],
                evidence: 'The carnival lasts ten days.',
                explanation: 'Lễ hội kéo dài đúng 10 ngày — ten days (C).',
              },
              {
                id: 'L15',
                num: 15,
                type: 'mcq',
                prompt: "What is the 'Sun and Sea' restaurant popular with?",
                options: ['friends', 'students', 'businessmen', 'families'],
                answer: 3,
                ttsDialogue: [
                  {
                    role: 'female',
                    text: "The 'Sun and Sea' restaurant has a great children's menu, so it's popular with families, especially at the weekends.",
                  },
                ],
                evidence: "So it's popular with families, especially at the weekends.",
                explanation: "Nhà hàng 'Sun and Sea' được các gia đình (families — D) ưa chuộng.",
              },
            ],
          },
        ],
      },

      /* -------------------- SECTION 2: READING (15 câu) -------------------- */
      {
        id: 'reading',
        title: 'Reading',
        viTitle: 'Kỹ năng Đọc hiểu',
        durationMin: 20,
        icon: 'book-open',
        description:
          'Gồm 3 phần: Part I (5 câu biển báo/tin nhắn), Part II (5 câu đoạn văn ngắn) và Part III (5 câu bài đọc "My friend Emma").',
        parts: [
          {
            id: 'r-p1',
            title: 'Part I: Notices, Mails, Notes or Messages (Questions 16–20)',
            instruction:
              'Read the following notices, mails, notes or messages and choose the best answer to the questions.',
            questions: [
              {
                id: 'R1',
                num: 16,
                type: 'notice_mcq',
                noticeStyle: 'sign',
                noticeTitle: 'REPAIRS: BIKES, SKATEBOARDS, SCOOTERS',
                noticeBody: 'Open: Tuesday – Saturday\nClosed: Sunday – Monday\nFirst repair: 10% discount',
                prompt: 'What does this notice say?',
                options: [
                  'New customers will pay less the first time they go to the shop.',
                  'Customers can buy bikes for less during the week.',
                  'The shop will repair things on Mondays.',
                  'Customers can have their scooter repaired on Sunday.',
                ],
                answer: 0,
                evidence: 'First repair: 10% discount',
                explanation:
                  'Đáp án A đúng vì lần sửa đầu tiên được giảm 10% ("pay less the first time"). B sai vì cửa hàng sửa chữa (repairs), không bán xe; C & D sai vì đóng cửa Chủ nhật và Thứ Hai.',
              },
              {
                id: 'R2',
                num: 17,
                type: 'notice_mcq',
                noticeStyle: 'sign',
                noticeTitle: 'WEBSITE-BUILDING CLUB',
                noticeBody:
                  "This week's meeting takes place at 3.30 p.m. in the library, not the computer room.",
                prompt: 'What does this notice say?',
                options: [
                  'The place where the club meets is the same every week.',
                  'The club meets in different rooms and at different times every week.',
                  'The club will not meet in the computer room anymore.',
                  'The place where the club meets is different this week.',
                ],
                answer: 3,
                evidence:
                  "This week's meeting takes place at 3.30 p.m. in the library, not the computer room.",
                explanation:
                  'Đáp án D đúng: tuần này địa điểm họp thay đổi sang thư viện thay vì phòng máy tính. C sai vì thông báo chỉ nói "This week" chứ không nói vĩnh viễn ("anymore").',
              },
              {
                id: 'R3',
                num: 18,
                type: 'notice_mcq',
                noticeStyle: 'message',
                noticeHeader: { to: 'Jason', from: 'Emma' },
                noticeBody:
                  "Jason,\nI have tickets to the music festival. It starts at 10 a.m. but let's meet at the train station earlier.\nEmma",
                prompt: 'Which statement is TRUE about the message?',
                options: [
                  "Jason will meet Emma before ten o'clock.",
                  "Emma will meet Jason at the station at ten o'clock.",
                  "Jason will buy tickets for the festival before ten o'clock.",
                  'The music festival starts before 10 a.m.',
                ],
                answer: 0,
                evidence: "It starts at 10 a.m. but let's meet at the train station earlier.",
                explanation:
                  'Đáp án A đúng: lễ hội bắt đầu lúc 10h nhưng Emma hẹn gặp sớm hơn ("earlier" = before ten o\'clock). C sai vì Emma đã có vé rồi.',
              },
              {
                id: 'R4',
                num: 19,
                type: 'notice_mcq',
                noticeStyle: 'sign',
                noticeTitle: 'Classroom rules',
                noticeBody: 'Please wear a white coat and safety glasses before entering the science lab.',
                prompt: 'What must students do according to the rules?',
                options: [
                  'Wear a white shirt to enter the lab.',
                  'Put on the right clothes and then go into the lab.',
                  'Enter the lab and then put on the right clothes.',
                  'Wear your school uniform during science lessons.',
                ],
                answer: 1,
                evidence: 'Please wear a white coat and safety glasses before entering the science lab.',
                explanation:
                  'Đáp án B đúng: phải mặc đúng đồ bảo hộ (áo choàng trắng và kính bảo hộ) trước khi vào phòng thí nghiệm ("before entering"). A sai vì "white shirt" ≠ "white coat + safety glasses".',
              },
              {
                id: 'R5',
                num: 20,
                type: 'notice_mcq',
                noticeStyle: 'message',
                noticeHeader: { to: 'Anna', from: 'Kim' },
                noticeBody:
                  'Anna,\nI made a mistake! My party starts at 8, not 7. Can you bring some drinks and pizza?\nKim',
                prompt: 'What does the message say?',
                options: [
                  'Anna thinks it is a mistake to have a party.',
                  'Anna can not attend the party.',
                  'Kim needs some things for the party.',
                  'The party will be on a different day and at a different time.',
                ],
                answer: 2,
                evidence: 'Can you bring some drinks and pizza?',
                explanation:
                  'Đáp án C đúng: Kim nhờ Anna mang đồ uống và pizza (cần một số đồ cho bữa tiệc). D sai vì chỉ đổi giờ (8h thay vì 7h), không đổi ngày.',
              },
            ],
          },
          {
            id: 'r-p2',
            title: 'Part II: Short Passages (Questions 21–25)',
            instruction: 'Read the following short passages and choose the best answer for each question.',
            questions: [
              {
                id: 'R6',
                num: 21,
                type: 'passage_mcq',
                passage:
                  'The race lasts 52 days, and people run from 6 a.m. until midnight, every day. Most people in the competition run about 100 km a day. They only have six hours to wash and sleep each day. They need to visit the doctor before they enter to check they are strong and healthy.',
                prompt: 'Why do runners need to visit the doctor before they join the race?',
                options: [
                  'to wash and sleep',
                  'to compete with each other',
                  'to be strong and healthy',
                  'to check their health',
                ],
                answer: 3,
                evidence:
                  'They need to visit the doctor before they enter to check they are strong and healthy.',
                explanation:
                  'Đáp án D đúng: "to check they are strong and healthy" đồng nghĩa với "to check their health". C là bẫy vì bác sĩ kiểm tra sức khỏe chứ không phải đến khám để "trở nên khỏe mạnh".',
              },
              {
                id: 'R7',
                num: 22,
                type: 'passage_mcq',
                passage:
                  "My name is Darcey and I'm from Australia, but I live in the UK. I'm a student at university in Liverpool. I'm studying fashion design and I think it is a very interesting subject. In the future, I want to work as a fashion designer in a large company, maybe in Singapore or Japan.",
                prompt: 'What nationality is Darcey?',
                options: ['Australian', 'British', 'Singaporean', 'Japanese'],
                answer: 0,
                evidence: "My name is Darcey and I'm from Australia, but I live in the UK.",
                explanation:
                  'Đáp án A đúng: Darcey đến từ Australia nên quốc tịch là Australian. UK chỉ là nơi đang sống và học tập.',
              },
              {
                id: 'R8',
                num: 23,
                type: 'passage_mcq',
                passage:
                  'My life in Liverpool is a little different from my life in Australia, but I like it. I have classes at university three days a week, on Monday morning, Tuesday morning and Thursday morning, so I get up early. On Wednesday and Friday, I get up late and study at home in my student flat or I go to the university library and study there.',
                prompt: 'When does the author have lessons at university?',
                options: [
                  'on Wednesday and Friday',
                  'on Monday, Tuesday and Wednesday',
                  'on Monday, Tuesday and Thursday',
                  'on Tuesday, Wednesday and Thursday',
                ],
                answer: 2,
                evidence:
                  'I have classes at university three days a week, on Monday morning, Tuesday morning and Thursday morning.',
                explanation:
                  'Đáp án C đúng: tác giả có lớp vào Thứ Hai, Thứ Ba và Thứ Năm (Monday, Tuesday and Thursday).',
              },
              {
                id: 'R9',
                num: 24,
                type: 'passage_mcq',
                passage:
                  'My life in Liverpool is a little different from my life in Australia, but I like it. I have classes at university three days a week, on Monday morning, Tuesday morning and Thursday morning, so I get up early. On Wednesday and Friday, I get up late and study at home in my student flat or I go to the university library and study there.',
                prompt: "What does the author do when he/she doesn't have lessons at university?",
                options: [
                  'He/she studies at home or in the library.',
                  'He/she goes to classes.',
                  'He/she gets up early.',
                  "He/she doesn't study.",
                ],
                answer: 0,
                evidence:
                  'On Wednesday and Friday, I get up late and study at home in my student flat or I go to the university library and study there.',
                explanation:
                  'Đáp án A đúng: vào Thứ Tư và Thứ Sáu (ngày không có lớp), tác giả tự học ở nhà (student flat) hoặc ra thư viện trường.',
              },
              {
                id: 'R10',
                num: 25,
                type: 'passage_mcq',
                passage:
                  "I don't spend time with my family because they live in Australia, but we often send messages and my parents and I always talk online on Saturday or Sunday. I check my messages and emails every day because my sister and my friends in Australia like sending me some pictures of their lives.",
                prompt: 'Why does the author check his messages and emails every day?',
                options: [
                  "to see pictures of his/her sister's and friends' lives",
                  'to send pictures of his work to friends',
                  'to get information about his homework',
                  'to watch online videos about Australia',
                ],
                answer: 0,
                evidence:
                  'I check my messages and emails every day because my sister and my friends in Australia like sending me some pictures of their lives.',
                explanation:
                  'Đáp án A đúng: tác giả kiểm tra tin nhắn và email mỗi ngày vì chị/em gái và bạn bè ở Úc hay gửi ảnh cuộc sống của họ.',
              },
            ],
          },
          {
            id: 'r-p3',
            title: 'Part III: Reading Comprehension — "My friend Emma" (Questions 26–30)',
            instruction: 'Read the text carefully and choose the best answer for each question.',
            sharedPassage: {
              title: 'My friend Emma',
              paragraphs: [
                "My friend Emma is an interesting person. She's Mexican, but now she lives in Berlin. She is married to Stefan and he is from Germany. They have two children called Evan and Sophia. Evan is six years old and Sophia is four years old.",
                "Emma's family is quite international. Her mother is Mexican and her father is American so Emma speaks Spanish and English fluently. Also, she speaks some German. She goes to German classes in the evenings and she practises with her husband and her children every day.",
                "Emma is a digital designer. She likes her job because she works with lots of people around the world. Emma doesn't work in an office; she works from home. Emma gets up early and works in the mornings when her children are at school. Sometimes she works in the evenings, but she doesn't work at weekends.",
              ],
            },
            questions: [
              {
                id: 'R11',
                num: 26,
                type: 'mcq',
                prompt: 'Where does Emma come from?',
                options: ['Germany', 'Mexico', 'the USA', 'Spain'],
                answer: 1,
                evidence: "She's Mexican, but now she lives in Berlin.",
                explanation:
                  'Đáp án B đúng: Emma là người Mexico ("Mexican"). Berlin (Germany) chỉ là nơi cô đang sinh sống.',
              },
              {
                id: 'R12',
                num: 27,
                type: 'mcq',
                prompt: 'How many languages can Emma speak?',
                options: ['one', 'two', 'three', 'four'],
                answer: 2,
                evidence: 'Emma speaks Spanish and English fluently. Also, she speaks some German.',
                explanation:
                  'Đáp án C đúng: Emma nói được tổng cộng 3 thứ tiếng — tiếng Tây Ban Nha (Spanish), tiếng Anh (English) và một chút tiếng Đức (German).',
              },
              {
                id: 'R13',
                num: 28,
                type: 'mcq',
                prompt: "Where does Emma's father come from?",
                options: ['Germany', 'Mexico', 'the USA', 'Spain'],
                answer: 2,
                evidence: 'Her mother is Mexican and her father is American.',
                explanation: 'Đáp án C đúng: Bố của Emma là người Mỹ ("American") → đến từ the USA.',
              },
              {
                id: 'R14',
                num: 29,
                type: 'mcq',
                prompt: 'What language does Emma study?',
                options: ['Spanish', 'Mexican', 'English', 'German'],
                answer: 3,
                evidence: 'She goes to German classes in the evenings.',
                explanation: 'Đáp án D đúng: Cô ấy đi học lớp tiếng Đức vào các buổi tối ("goes to German classes").',
              },
              {
                id: 'R15',
                num: 30,
                type: 'mcq',
                prompt: 'Where does Emma work?',
                options: ['at home', 'in an office', 'at school', 'in a class'],
                answer: 0,
                evidence: "Emma doesn't work in an office; she works from home.",
                explanation: 'Đáp án A đúng: Emma không làm ở văn phòng mà làm việc tại nhà ("works from home").',
              },
            ],
          },
        ],
      },

      /* -------------------- SECTION 3: WRITING (10 câu) -------------------- */
      {
        id: 'writing',
        title: 'Writing',
        viTitle: 'Kỹ năng Viết câu',
        durationMin: 15,
        icon: 'pen-nib',
        description:
          'Gồm 2 phần: Part I (5 câu kéo thả / chạm chèn từ sắp xếp câu) và Part II (5 câu viết hoàn chỉnh từ từ gợi ý, hỗ trợ chấm diff từng từ).',
        parts: [
          {
            id: 'w-p1',
            title: 'Part I: Put the words/phrases in the correct order (Questions 31–35)',
            instruction:
              'Kéo thả thẻ từ vào vị trí mong muốn, hoặc chạm vào khe chèn (|) trong khung câu rồi bấm thẻ từ để chèn đúng vị trí.',
            questions: [
              {
                id: 'W1',
                num: 31,
                type: 'scramble',
                prompt: 'an / company / engineering / for / He / works / . /',
                tokens: ['an', 'company', 'engineering', 'for', 'He', 'works', '.'],
                correctOrder: ['He', 'works', 'for', 'an', 'engineering', 'company', '.'],
                acceptedSentences: ['He works for an engineering company.'],
                hints: [
                  'Cấu trúc: Chủ ngữ + works for + mạo từ + cụm danh từ + dấu chấm.',
                  'Bắt đầu bằng: "He works for ..."',
                ],
                explanation:
                  'Cụm động từ "work for + tổ chức/công ty" (làm việc cho...). "an engineering company" là cụm danh từ với mạo từ "an" đứng trước nguyên âm /e/.',
              },
              {
                id: 'W2',
                num: 32,
                type: 'scramble',
                prompt: "doesn't / a / out / go / She / lot / . /",
                tokens: ["doesn't", 'a', 'out', 'go', 'She', 'lot', '.'],
                correctOrder: ['She', "doesn't", 'go', 'out', 'a', 'lot', '.'],
                acceptedSentences: ["She doesn't go out a lot."],
                hints: [
                  'Câu phủ định thì hiện tại đơn: S + doesn\'t + V(nguyên thể) + trạng từ chỉ mức độ.',
                  'Bắt đầu bằng: "She doesn\'t go ..."',
                ],
                explanation: 'Cụm động từ "go out" (đi ra ngoài) + "a lot" (nhiều) đặt ở cuối câu.',
              },
              {
                id: 'W3',
                num: 33,
                type: 'scramble',
                prompt: 'studies / at / university / law / She / . /',
                tokens: ['studies', 'at', 'university', 'law', 'She', '.'],
                correctOrder: ['She', 'studies', 'law', 'at', 'university', '.'],
                acceptedSentences: ['She studies law at university.'],
                hints: [
                  'Cấu trúc: Chủ ngữ + động từ + môn học (tân ngữ) + nơi chốn.',
                  'Bắt đầu bằng: "She studies law ..."',
                ],
                explanation:
                  'Trật tự chuẩn tiếng Anh: S (She) + V (studies) + O (law) + Place (at university).',
              },
              {
                id: 'W4',
                num: 34,
                type: 'scramble',
                prompt: 'you / tired / morning / often / Are / in / the / ? /',
                tokens: ['you', 'tired', 'morning', 'often', 'Are', 'in', 'the', '?'],
                correctOrder: ['Are', 'you', 'often', 'tired', 'in', 'the', 'morning', '?'],
                acceptedSentences: ['Are you often tired in the morning?'],
                hints: [
                  'Câu hỏi Yes/No với động từ "to be": Are + S + trạng từ tần suất + tính từ + cụm thời gian?',
                  'Bắt đầu bằng: "Are you often ..."',
                ],
                explanation:
                  'Trạng từ tần suất "often" đứng sau chủ ngữ (trong câu hỏi đảo ngữ với "to be") và trước tính từ "tired". Cụm thời gian "in the morning" đứng cuối câu.',
              },
              {
                id: 'W5',
                num: 35,
                type: 'scramble',
                prompt: 'go / does / How / boat / the / often / ? /',
                tokens: ['go', 'does', 'How', 'boat', 'the', 'often', '?'],
                correctOrder: ['How', 'often', 'does', 'the', 'boat', 'go', '?'],
                acceptedSentences: ['How often does the boat go?'],
                hints: [
                  'Câu hỏi tần suất với động từ thường: How often + trợ động từ + S + V(nguyên thể)?',
                  'Bắt đầu bằng: "How often does ..."',
                ],
                explanation:
                  '"How often" (bao lâu một lần) + trợ động từ "does" (vì "the boat" là số ít) + động từ nguyên thể "go".',
              },
            ],
          },
          {
            id: 'w-p2',
            title: 'Part II: Use the given words to make meaningful sentences (Questions 36–40)',
            instruction:
              'Thêm từ cần thiết (trợ động từ, giới từ, mạo từ) và chia động từ đúng thì để tạo thành câu hoàn chỉnh.',
            questions: [
              {
                id: 'W6',
                num: 36,
                type: 'guided_writing',
                promptTokens: ['What', 'your', 'favorite', 'type', 'restaurant', '?'],
                modelAnswer: 'What is your favorite type of restaurant?',
                acceptedAnswers: [
                  'What is your favorite type of restaurant?',
                  "What's your favorite type of restaurant?",
                  'What is your favourite type of restaurant?',
                  "What's your favourite type of restaurant?",
                ],
                hints: [
                  'Cần bổ sung động từ "to be" (is) và giới từ nối danh từ "type ... restaurant".',
                  'Cấu trúc: What is + your favorite type of + N?',
                ],
                explanation:
                  'Cần thêm "is" sau "What" và giới từ "of" trong cụm "type of restaurant" (loại nhà hàng). Chấp nhận cả "What\'s" và chính tả Anh-Anh "favourite".',
              },
              {
                id: 'W7',
                num: 37,
                type: 'guided_writing',
                promptTokens: ['you', 'go', 'bed', 'late', 'weekend', '?'],
                modelAnswer: 'Do you go to bed late at the weekend?',
                acceptedAnswers: [
                  'Do you go to bed late at the weekend?',
                  'Do you go to bed late on the weekend?',
                  'Do you go to bed late at weekends?',
                  'Do you go to bed late on weekends?',
                ],
                hints: [
                  'Câu hỏi hiện tại đơn với động từ thường "go" + cụm cố định "đi ngủ" + giới từ chỉ cuối tuần.',
                  'Thêm: "Do", "to" (go to bed), và "at the" / "on the" (trước weekend).',
                ],
                explanation:
                  'Câu hỏi hiện tại đơn với chủ ngữ "you" mượn trợ động từ "Do". Cụm cố định là "go to bed" (đi ngủ) và "at the weekend" (Anh-Anh) hoặc "on the weekend" (Anh-Mỹ).',
              },
              {
                id: 'W8',
                num: 38,
                type: 'guided_writing',
                promptTokens: ['Mark', 'go', 'cinema', 'four', 'five', 'times', 'year', '.'],
                modelAnswer: 'Mark goes to the cinema four or five times a year.',
                acceptedAnswers: ['Mark goes to the cinema four or five times a year.'],
                hints: [
                  'Chia động từ "go" theo ngôi thứ 3 số ít (Mark), thêm cụm "to the cinema", liên từ "or" và mạo từ "a".',
                  'Bắt đầu bằng: "Mark goes to the cinema ..."',
                ],
                explanation:
                  'Chủ ngữ số ít "Mark" → "goes"; cụm cố định "go to the cinema"; "four or five times a year" (4 hoặc 5 lần một năm).',
              },
              {
                id: 'W9',
                num: 39,
                type: 'guided_writing',
                promptTokens: ['your town', 'have', 'food market', '?'],
                modelAnswer: 'Does your town have a food market?',
                acceptedAnswers: ['Does your town have a food market?'],
                hints: [
                  '"your town" là danh từ số ít → dùng trợ động từ gì đầu câu hỏi? Đừng quên mạo từ trước "food market".',
                  'Thêm "Does" ở đầu câu và "a" trước "food market".',
                ],
                explanation:
                  'Câu hỏi hiện tại đơn với chủ ngữ số ít "your town" mượn "Does" (động từ "have" giữ nguyên). "food market" là danh từ đếm được số ít nên cần mạo từ "a".',
              },
              {
                id: 'W10',
                num: 40,
                type: 'guided_writing',
                promptTokens: ['Peter', 'often', 'spend', 'about four hours', 'day', 'online', 'work', '.'],
                modelAnswer: 'Peter often spends about four hours a day working online.',
                acceptedAnswers: [
                  'Peter often spends about four hours a day working online.',
                  'Peter often spends about four hours a day on online work.',
                  'Peter often spends about four hours per day working online.',
                ],
                hints: [
                  'Cấu trúc: spend + thời gian + V-ing (hoặc spend + thời gian + on + danh từ).',
                  'Chia "spends", thêm "a" trước "day", và đổi "online / work" thành "working online".',
                ],
                explanation:
                  'Cấu trúc trọng tâm HA1: "spend + time + V-ing" → "Peter often spends about four hours a day working online." (cũng chấp nhận "... on online work.").',
              },
            ],
          },
        ],
      },
    ],
  },
];
