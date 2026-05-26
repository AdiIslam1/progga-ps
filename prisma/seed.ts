import { Day, PrismaClient, UserSex, FeeStatus, NoticeType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = await bcrypt.hash("password123", 10);

  console.log("Seeding started...");

  // SMS CONFIG
  await prisma.smsConfig.create({
    data: {
      apiUrl: "https://api.greenweb.com.bd/api.php",
      apiKey: "MOCK-BANGLA-SMS-KEY-9876",
      senderId: "BORNOMALA-HS",
    },
  });

  // ADMIN
  await prisma.admin.create({
    data: {
      id: "admin1",
      username: "admin1",
      password: defaultPassword,
    },
  });
  await prisma.admin.create({
    data: {
      id: "admin2",
      username: "admin2",
      password: defaultPassword,
    },
  });

  // CLASS (Class 1 to Class 6)
  for (let i = 1; i <= 6; i++) {
    await prisma.class.create({
      data: {
        name: `${i}`,
        capacity: 20,
      },
    });
  }

  // SUBJECT — each class gets its own set of subjects
  const subjectNames = [
    "Bangla",
    "English",
    "Mathematics",
    "Science",
    "Bangladesh & Global Studies",
    "ICT",
    "Religion & Moral Education",
    "Physical Education",
    "Arts & Crafts",
    "Agriculture Studies",
  ];

  // Classes 1–6, subjects are the same set but scoped per class
  for (let classId = 1; classId <= 6; classId++) {
    for (const name of subjectNames) {
      await prisma.subject.create({ data: { name, classId } });
    }
  }

  // Subjects are now indexed 1–60 (classId 1: ids 1-10, classId 2: ids 11-20, etc.)

  // TEACHER
  for (let i = 1; i <= 15; i++) {
    await prisma.teacher.create({
      data: {
        id: `teacher${i}`,
        username: `teacher${i}`,
        password: defaultPassword,
        name: `TName${i}`,
        surname: `TSurname${i}`,
        email: `teacher${i}@bornomala.edu.bd`,
        phone: `0171234567${i}`,
        address: `Dhaka, Bangladesh`,
        bloodType: "A+",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        subjects: { connect: [{ id: (i % 10) + 1 }] }, 
        classes: { connect: [{ id: (i % 6) + 1 }] }, 
        birthday: new Date(1990, 5, i),
      },
    });
  }

  // LESSON — pick a subject that belongs to the lesson's class
  // Subject IDs: class 1 → 1-10, class 2 → 11-20, ..., class N → (N-1)*10+1 to N*10
  for (let i = 1; i <= 30; i++) {
    const lessonClassId = (i % 6) + 1;
    const subjectOffset = (i % 10) + 1; // 1-10
    const subjectId = (lessonClassId - 1) * 10 + subjectOffset;
    await prisma.lesson.create({
      data: {
        name: `Lesson ${i}`,
        day: Day[
          Object.keys(Day)[
            Math.floor(Math.random() * Object.keys(Day).length)
          ] as keyof typeof Day
        ],
        startTime: new Date(2026, 4, 22, 9, 0),
        endTime: new Date(2026, 4, 22, 10, 30),
        subjectId,
        classId: lessonClassId,
        teacherId: `teacher${(i % 15) + 1}`,
      },
    });
  }

  // STUDENT
  const year = new Date().getFullYear() % 100; // e.g. 26
  const classSerials: Record<number, number> = {};

  for (let i = 1; i <= 50; i++) {
    let customTuitionFee: number | null = null;
    if (i === 1) customTuitionFee = 800;
    if (i === 2) customTuitionFee = 0;
    if (i === 3) customTuitionFee = 500;

    const classLevel = (i % 6) + 1;
    classSerials[classLevel] = (classSerials[classLevel] || 0) + 1;
    const studentId = year * 100000 + classLevel * 1000 + classSerials[classLevel];
    const studentPassword = await bcrypt.hash(studentId.toString(), 10);

    await prisma.student.create({
      data: {
        id: `student${i}`,
        studentId,
        password: studentPassword,
        name: `SName${i}`,
        surname: `SSurname ${i}`,
        phone: `015555555${i < 10 ? `0${i}` : i}`,
        address: `Dhaka, Bangladesh`,
        bloodType: "O-",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        guardianName: `Guardian ${i}`,
        guardianPhone: `019876543${i < 10 ? `0${i}` : i}`,
        classId: classLevel,
        customTuitionFee,
        birthday: new Date(2012, 1, i),
      },
    });
  }

  // FEE PACKAGES (Taka base)
  const tuitionFeesByGrade = [1200, 1400, 1500, 1600, 1800, 2000]; // Class 1 to 6 base tuition in BDT
  const packages: any[] = [];
  
  for (let g = 1; g <= 6; g++) {
    const pkg = await prisma.feePackage.create({
      data: {
        name: `Class ${g} Monthly Tuition`,
        description: `Monthly tuition fee for Class ${g} students`,
        amount: tuitionFeesByGrade[g - 1],
        classId: g,
      },
    });
    packages.push(pkg);
  }

  const examFeePkg = await prisma.feePackage.create({
    data: {
      name: "Half-Yearly Exam Fee",
      description: "Terminal exam execution fee",
      amount: 500,
    },
  });

  const sportsFeePkg = await prisma.feePackage.create({
    data: {
      name: "Annual Sports & Cultural Fee",
      description: "Co-curricular entry charges",
      amount: 300,
    },
  });

  // FEE COLLECTIONS (Billing starts January 2026)
  const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05"];
  
  // Fetch seeded students
  const dbStudents = await prisma.student.findMany();

  let receiptCounter = 1000;

  for (const student of dbStudents) {
    const classLevel = student.classId; // classId 1–6 matches class name "1"–"6"
    const baseTuition = tuitionFeesByGrade[classLevel - 1];
    const actualTuition = student.customTuitionFee !== null ? student.customTuitionFee : baseTuition;
    const standardPkg = packages[classLevel - 1];

    // Monthly Tuition Fees
    for (let mIdx = 0; mIdx < months.length; mIdx++) {
      const month = months[mIdx];
      // Let's make everyone PAID for Jan, Feb
      // March is unpaid for student1-10
      // April is unpaid for student1-20
      // May is unpaid for everyone
      let status: FeeStatus = FeeStatus.PAID;
      if (month === "2026-05") {
        status = FeeStatus.UNPAID;
      } else if (month === "2026-04" && parseInt(student.id.replace("student", "")) <= 20) {
        status = FeeStatus.UNPAID;
      } else if (month === "2026-03" && parseInt(student.id.replace("student", "")) <= 10) {
        status = FeeStatus.UNPAID;
      }

      const paidAmount = status === FeeStatus.PAID ? actualTuition : 0;
      const paidAt = status === FeeStatus.PAID ? new Date(2026, mIdx, 5 + (parseInt(student.id.replace("student", "")) % 20)) : null;
      const receiptNo = status === FeeStatus.PAID ? `REC-20260${mIdx + 1}-${receiptCounter++}` : null;

      await prisma.feeCollection.create({
        data: {
          studentId: student.id,
          feePackageId: standardPkg.id,
          name: `Tuition Fee - ${new Date(2026, mIdx, 1).toLocaleString('default', { month: 'long' })} 2026`,
          amount: actualTuition,
          month,
          status,
          paidAmount,
          paidAt,
          receiptNo,
          receivedById: status === FeeStatus.PAID ? "admin1" : null,
        },
      });
    }

    // Dynamic additional fees (e.g. Exam Fee of 500)
    // Make 1-15 PAID, the rest UNPAID
    const studentNum = parseInt(student.id.replace("student", ""));
    const isExamPaid = studentNum <= 15;
    await prisma.feeCollection.create({
      data: {
        studentId: student.id,
        feePackageId: examFeePkg.id,
        name: "Half-Yearly Exam Fee 2026",
        amount: 500,
        month: null,
        status: isExamPaid ? FeeStatus.PAID : FeeStatus.UNPAID,
        paidAmount: isExamPaid ? 500 : 0,
        paidAt: isExamPaid ? new Date(2026, 3, 10) : null,
        receiptNo: isExamPaid ? `REC-202604-${receiptCounter++}` : null,
        receivedById: isExamPaid ? "admin1" : null,
      },
    });
  }

  // EXPENDITURE (BDT Base)
  await prisma.expense.create({
    data: { title: "Teacher Monthly Salaries", amount: 180000, category: "Salary" },
  });
  await prisma.expense.create({
    data: { title: "Electricity & Utility Bills", amount: 9200, category: "Utility" },
  });
  await prisma.expense.create({
    data: { title: "High-Speed Internet & IT Support", amount: 5000, category: "ICT" },
  });
  await prisma.expense.create({
    data: { title: "Lab Chemical and Apparatus Refurbishing", amount: 12000, category: "Lab" },
  });
  await prisma.expense.create({
    data: { title: "Whiteboard Markers & Stationery Supplies", amount: 3500, category: "Stationery" },
  });

  // SMS NOTICE LOGS
  await prisma.notice.create({
    data: {
      title: "Absence Warning Alert",
      content: "Dear Guardian, your ward SName1 was absent today from the morning assembly and lessons without prior notice. Progga HS.",
      type: NoticeType.SMS,
      recipientId: "student1",
      classId: 1,
    },
  });
  await prisma.notice.create({
    data: {
      title: "Parent-Teacher Meeting Notice",
      content: "Dear Guardians, we request your presence at our upcoming Half-Yearly Progress Evaluation Meeting on Saturday at 10:00 AM.",
      type: NoticeType.SMS,
      classId: 1,
    },
  });
  await prisma.notice.create({
    data: {
      title: "Tuition Dues Warning",
      content: "Dear Guardian, the monthly tuition fees for April are currently overdue. Please settle outstanding payments at the cash counter. Bornomala HS.",
      type: NoticeType.SMS,
    },
  });

  // EXAMS & SCHEDULES & RESULTS (Adding term details, removing assignment logic)
  for (let i = 1; i <= 10; i++) {
    const exam = await prisma.exam.create({
      data: {
        title: i <= 5 ? "Half Yearly" : "Final Exam",
      },
    });

    const examClassId = (i % 6) + 1;
    const examSubjectOffset = (i % 10) + 1;
    const examSubjectId = (examClassId - 1) * 10 + examSubjectOffset;
    await prisma.examSchedule.create({
      data: {
        examId: exam.id,
        subjectId: examSubjectId,
        date: new Date(2026, 5, 10 + i),
        startTime: new Date(2026, 5, 10 + i, 10, 0),
        endTime: new Date(2026, 5, 10 + i, 13, 0),
        room: `Room ${200 + i}`,
      },
    });

    // Create Result (calculating BDT-compliant Board GPA + grades)
    for (let r = 1; r <= 5; r++) {
      const score = 40 + (r * 11); // e.g. 51, 62, 73, 84, 95
      let gpa = 0.0;
      let grade = "F";

      if (score >= 80) { gpa = 5.0; grade = "A+"; }
      else if (score >= 70) { gpa = 4.0; grade = "A"; }
      else if (score >= 60) { gpa = 3.5; grade = "A-"; }
      else if (score >= 50) { gpa = 3.0; grade = "B"; }
      else if (score >= 40) { gpa = 2.0; grade = "C"; }
      else if (score >= 33) { gpa = 1.0; grade = "D"; }

      await prisma.result.create({
        data: {
          score,
          gpa,
          grade,
          studentId: `student${r}`, 
          examId: exam.id,
        },
      });
    }
  }

  // ATTENDANCE
  for (let i = 1; i <= 10; i++) {
    const studentClassId = (i % 6) + 1;
    const subjectOffset = (i % 10) + 1;
    const attendanceSubjectId = (studentClassId - 1) * 10 + subjectOffset;
    await prisma.attendance.create({
      data: {
        date: new Date(2026, 4, 22),
        present: i % 5 !== 0, // Mock 80% attendance rate
        studentId: `student${i}`,
        subjectId: attendanceSubjectId,
      },
    });
  }

  // EVENT
  for (let i = 1; i <= 5; i++) {
    await prisma.event.create({
      data: {
        title: `Extra Event ${i}`, 
        description: `Description for school event ${i}`, 
        startTime: new Date(2026, 5, 1, 9, 0), 
        endTime: new Date(2026, 5, 1, 12, 0), 
        classId: (i % 5) + 1, 
      },
    });
  }

  // ANNOUNCEMENT
  for (let i = 1; i <= 5; i++) {
    await prisma.announcement.create({
      data: {
        title: `School Announcement ${i}`, 
        description: `Notice for teachers and parents regarding event ${i}`, 
        date: new Date(), 
        classId: (i % 5) + 1, 
      },
    });
  }

  // REPORT CARD SEEDING
  for (let i = 1; i <= 5; i++) {
    await prisma.reportCard.create({
      data: {
        studentId: `student${i}`,
        term: "HALF_YEARLY",
        gpa: 4.5,
        grade: "A",
        year: 2026,
      },
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
