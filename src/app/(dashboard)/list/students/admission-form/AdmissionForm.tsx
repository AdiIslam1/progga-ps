"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSchema, StudentSchema } from "@/lib/formValidationSchemas";
import { createStudent, updateStudent } from "@/lib/actions";
import { useFormState } from "react-dom";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

type Class = { id: number; name: string };

const currentYear = new Date().getFullYear();

function Field({
  label,
  name,
  register,
  error,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  error?: { message?: string };
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="ring-1 ring-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white"
        {...register(name)}
      />
      {error?.message && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
}

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3">
      <span className="w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {num}
      </span>
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

export default function AdmissionForm({
  classes,
  type = "create",
  data,
}: {
  classes: Class[];
  type?: "create" | "update";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}) {
  const router = useRouter();
  const [state, formAction] = useFormState(
    type === "create" ? createStudent : updateStudent,
    { success: false, error: false }
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      admissionFee: 0,
      admissionYear: data?.admissionYear ?? currentYear,
      classId: data?.classId ? String(data.classId) : undefined,
      name: data?.name ?? "",
      surname: data?.surname ?? "",
      nameBn: data?.nameBn ?? "",
      sex: data?.sex ?? "",
      birthday: data?.birthday ? new Date(data.birthday).toISOString().split("T")[0] : "",
      birthRegNo: data?.birthRegNo ?? "",
      bloodType: data?.bloodType ?? "",
      phone: data?.phone ?? "",
      address: data?.address ?? "",
      section: data?.section ?? "",
      rollNo: data?.rollNo ?? "",
      group: data?.group ?? "",
      shift: data?.shift ?? "",
      fatherName: data?.fatherName ?? "",
      motherName: data?.motherName ?? "",
      fatherNameEn: data?.fatherNameEn ?? "",
      fatherPhone: data?.fatherPhone ?? "",
      fatherNid: data?.fatherNid ?? "",
      fatherAddress: data?.fatherAddress ?? "",
      fatherUpazila: data?.fatherUpazila ?? "",
      fatherWorkAddress: data?.fatherWorkAddress ?? "",
      motherNameEn: data?.motherNameEn ?? "",
      motherNid: data?.motherNid ?? "",
      birthVillage: data?.birthVillage ?? "",
      birthDistrict: data?.birthDistrict ?? "",
      birthUpazila: data?.birthUpazila ?? "",
      birthThana: data?.birthThana ?? "",
      permVillage: data?.permVillage ?? "",
      permDistrict: data?.permDistrict ?? "",
      permUpazila: data?.permUpazila ?? "",
      permThana: data?.permThana ?? "",
      religion: data?.religion ?? "",
      guardianName: data?.guardianName ?? "",
      guardianPhone: data?.guardianPhone ?? "",
      prevSchoolName: data?.prevSchoolName ?? "",
      prevSchoolClass: data?.prevSchoolClass ?? "",
      prevSchoolSection: data?.prevSchoolSection ?? "",
      prevSchoolRoll: data?.prevSchoolRoll ?? "",
      prevTutors: data?.prevTutors ?? "",
      prevPassMarks: data?.prevPassMarks ?? "",
      prevSubjectCount: data?.prevSubjectCount ?? "",
      prevSession: data?.prevSession ?? "",
    },
  });

  useEffect(() => {
    if (state.success) {
      if (type === "create" && (state as { id?: string }).id) {
        toast("Student admitted successfully!");
        router.push(`/list/students/${(state as { id?: string }).id}`);
      } else if (type === "update") {
        toast("Student updated successfully!");
        router.push(`/list/students/${data?.id}`);
      }
    }
  }, [state, router, type, data?.id]);

  const onSubmit = handleSubmit((formData) => {
    formAction(formData);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-1">

      {data && <input type="hidden" {...register("id")} defaultValue={data.id} />}

      {/* Admission year + class + fee */}
      <div className="grid grid-cols-3 gap-4 mb-2">
        <Field label="শিক্ষা বর্ষ (Academic Year)" name="admissionYear" register={register} type="number" placeholder={String(currentYear)} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            ভর্তির শ্রেণী (Class)<span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            className="ring-1 ring-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            {...register("classId")}
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>Class {c.name}</option>
            ))}
          </select>
          {errors.classId?.message && <p className="text-xs text-red-500">{String(errors.classId.message)}</p>}
        </div>
        <Field
          label="ভর্তি ফি / Admission Fee (৳)"
          name="admissionFee"
          register={register}
          type="number"
          placeholder="e.g. 500"
          required
          error={errors.admissionFee}
        />
      </div>

      {/* SECTION 1 */}
      <SectionHeader num="১" title="শিক্ষার্থীর তথ্য (Student Information)" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="শিক্ষার্থীর নাম (বাংলায়)" name="nameBn" register={register} placeholder="বাংলায় পূর্ণ নাম" />
        <Field label="Name in English — First" name="name" register={register} required placeholder="First name" error={errors.name} />
        <Field label="Name in English — Last" name="surname" register={register} required placeholder="Last name / Surname" error={errors.surname} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">লিঙ্গ (Sex)<span className="text-red-500 ml-0.5">*</span></label>
          <select className="ring-1 ring-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white" {...register("sex")}>
            <option value="">Select</option>
            <option value="MALE">Male (ছেলে)</option>
            <option value="FEMALE">Female (মেয়ে)</option>
          </select>
          {errors.sex?.message && <p className="text-xs text-red-500">{String(errors.sex.message)}</p>}
        </div>
        <Field label="জন্ম তারিখ (Date of Birth)" name="birthday" register={register} required type="date" error={errors.birthday} />
        <Field label="জন্মনিবন্ধন নং (Birth Reg. No.)" name="birthRegNo" register={register} placeholder="17-digit number" />
        <Field label="রক্তের গ্রুপ (Blood Type)" name="bloodType" register={register} required placeholder="e.g. A+" error={errors.bloodType} />
        <Field label="ফোন নম্বর (Phone)" name="phone" register={register} placeholder="Student phone" />
        <Field label="পিতার নাম — বাংলায় (Father's Name in Bengali)" name="fatherName" register={register} placeholder="পিতার নাম" />
        <Field label="মাতার নাম — বাংলায় (Mother's Name in Bengali)" name="motherName" register={register} placeholder="মাতার নাম" />
        <Field label="শ্রেণী (Section)" name="section" register={register} placeholder="e.g. A, B" />
        <Field label="রোল নং (Roll No.)" name="rollNo" register={register} type="number" placeholder="Current roll" />
        <Field label="শাখা / গ্রুপ (Group)" name="group" register={register} placeholder="e.g. SCIENCE, ARTS" />
        <Field label="শিফট (Shift)" name="shift" register={register} placeholder="e.g. Day, Morning" />
      </div>

      {/* Previous School */}
      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">পূর্ববর্তী শিক্ষা প্রতিষ্ঠান (Previous School)</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="স্কুলের নাম (School Name)" name="prevSchoolName" register={register} placeholder="Previous school" />
          </div>
          <Field label="শ্রেণী (Class)" name="prevSchoolClass" register={register} placeholder="e.g. 3" />
          <Field label="শাখা (Section)" name="prevSchoolSection" register={register} placeholder="e.g. A" />
          <Field label="রোল নং (Roll No.)" name="prevSchoolRoll" register={register} placeholder="Previous roll" />
        </div>
      </div>

      <div className="mt-3">
        <Field label="গত দুই বছরে যাদের কাছে পড়েছো তাদের নাম (Previous Tutors)" name="prevTutors" register={register} placeholder="Names of private tutors" />
      </div>

      {/* SECTION 2 */}
      <SectionHeader num="২" title="পিতা/অভিভাবকের তথ্য (Father / Guardian)" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="পিতার নাম — English (Father's Name in English)" name="fatherNameEn" register={register} placeholder="IN CAPITAL LETTERS" />
        <Field label="মোবাইল নং (Father's Phone)" name="fatherPhone" register={register} placeholder="01X-XXXXXXXX" />
        <Field label="জাতীয় পরিচয়পত্র নং (Father's NID)" name="fatherNid" register={register} placeholder="NID number" />
        <Field label="কর্মস্থলের ঠিকানা (Work Address)" name="fatherWorkAddress" register={register} placeholder="Workplace" />
        <div className="col-span-2">
          <Field label="বর্তমান পূর্ণ ঠিকানা (Current Full Address)" name="fatherAddress" register={register} placeholder="House, road, area..." />
        </div>
        <Field label="উপজেলা/থানা (Upazila / Thana)" name="fatherUpazila" register={register} placeholder="Upazila" />
      </div>

      {/* SECTION 3 */}
      <SectionHeader num="৩" title="মাতার তথ্য (Mother)" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="মাতার নাম — English (Mother's Name in English)" name="motherNameEn" register={register} placeholder="IN CAPITAL LETTERS" />
        <Field label="জাতীয় পরিচয়পত্র নং (Mother's NID)" name="motherNid" register={register} placeholder="NID number" />
      </div>

      {/* SECTION 4 */}
      <SectionHeader num="৪" title="জন্মস্থান (Birthplace)" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="গ্রাম/শহর (Village / City)" name="birthVillage" register={register} />
        <Field label="জেলা ও পোস্ট (District & Post)" name="birthDistrict" register={register} />
        <Field label="উপজেলা (Upazila)" name="birthUpazila" register={register} />
        <Field label="উপজেলা/থানা (Thana)" name="birthThana" register={register} />
      </div>

      {/* SECTION 5 */}
      <SectionHeader num="৫" title="স্থায়ী ঠিকানা (Permanent Address)" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="গ্রাম/শহর (Village / City)" name="permVillage" register={register} />
        <Field label="জেলা ও পোস্ট (District & Post)" name="permDistrict" register={register} />
        <Field label="উপজেলা (Upazila)" name="permUpazila" register={register} />
        <Field label="উপজেলা/থানা (Thana)" name="permThana" register={register} />
      </div>

      {/* SECTION 6 */}
      <SectionHeader num="৬" title="অন্যান্য (Other)" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="ধর্ম (Religion)" name="religion" register={register} placeholder="e.g. Islam, Hindu, Christian" />
        <Field
          label="বর্তমান ঠিকানা (Current Address)"
          name="address"
          register={register}
          required
          placeholder="Student's current address"
          error={errors.address}
        />
        <Field label="অভিভাবকের নাম (Guardian Name)" name="guardianName" register={register} />
        <Field label="অভিভাবকের ফোন (Guardian Phone)" name="guardianPhone" register={register} />
      </div>

      {/* SECTION 7 */}
      <SectionHeader num="৭" title="পূর্ববর্তী ফলাফল (Previous Results)" />
      <div className="grid grid-cols-3 gap-4">
        <Field label="পাশের নম্বর (Passing Marks)" name="prevPassMarks" register={register} type="number" />
        <Field label="বিষয় সংখ্যা (No. of Subjects)" name="prevSubjectCount" register={register} type="number" />
        <Field label="সেশন (Session)" name="prevSession" register={register} placeholder="e.g. 2024-25" />
      </div>

      {/* Error / Submit */}
      {state.error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2 mt-4">
          Something went wrong. Please check all required fields and try again.
        </p>
      )}

      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold px-8 py-2.5 rounded-xl text-sm transition-colors"
        >
          {isSubmitting
            ? type === "create" ? "Saving..." : "Updating..."
            : type === "create" ? "Submit Admission" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
