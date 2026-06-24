"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { teacherSchema, TeacherSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";

type Subject = { id: number; name: string; class: { name: string } };

const TeacherForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
  });

  const [imgUrl, setImgUrl] = useState<string | undefined>(data?.img);

  const [state, formAction] = useFormState(
    type === "create" ? createTeacher : updateTeacher,
    { success: false, error: false }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Teacher has been ${type === "create" ? "created" : "updated"}!`);
      if (setOpen) {
        setOpen(false);
        router.refresh();
      } else {
        router.push("/list/teachers");
      }
    }
  }, [state, router, type, setOpen]);

  const onSubmit = handleSubmit((d) => formAction({ ...d }));

  const subjects: Subject[] = relatedData?.subjects ?? [];

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          {type === "create" ? "Add New Teacher" : "Edit Teacher"}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {type === "create"
            ? "Fill in the details to register a new teacher."
            : "Update the teacher's information below."}
        </p>
      </div>

      {/* Account */}
      <section>
        <h3 className="text-sm font-semibold text-gray-600 mb-3 pb-1 border-b border-gray-100">
          Account Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Email"
            name="email"
            defaultValue={data?.email}
            register={register}
            error={errors?.email}
          />
          <div className="flex flex-col gap-1">
            <InputField
              label={type === "create" ? "Password (optional)" : "New Password (leave blank to keep)"}
              name="password"
              type="password"
              defaultValue={data?.password}
              register={register}
              error={errors?.password}
            />
            {type === "create" && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                Defaults to phone number, or &quot;12345678&quot; if no phone set.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Personal */}
      <section>
        <h3 className="text-sm font-semibold text-gray-600 mb-3 pb-1 border-b border-gray-100">
          Personal Information
        </h3>

        {/* Photo Upload */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-3">
            <CldUploadWidget
              uploadPreset="progga_preset"
              options={{ maxFiles: 1, clientAllowedFormats: ["image"] }}
              onSuccess={(result: any) => {
                setImgUrl(result.info.secure_url);
                setValue("img", result.info.secure_url);
              }}
            >
              {({ open }) => {
                return (
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => open()}>
                    <div className="w-20 h-20 rounded-md overflow-hidden bg-white border border-gray-200 flex-shrink-0 relative shadow-sm">
                      <Image
                        src={imgUrl || "/noAvatar.png"}
                        alt="Profile Photo"
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <span className="text-sm font-medium text-blue-600 hover:underline">
                      Upload Photo
                    </span>
                  </div>
                );
              }}
            </CldUploadWidget>
          </div>
          <input type="hidden" {...register("img")} value={imgUrl || ""} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <InputField label="First Name" name="name" defaultValue={data?.name} register={register} error={errors.name} />
          <InputField label="Last Name" name="surname" defaultValue={data?.surname} register={register} error={errors.surname} />
          <InputField label="Phone" name="phone" defaultValue={data?.phone} register={register} error={errors.phone} />
          <InputField label="Address" name="address" defaultValue={data?.address} register={register} error={errors.address} />
          <InputField
            label="Date of Birth"
            name="birthday"
            type="date"
            defaultValue={data?.birthday ? new Date(data.birthday).toISOString().split("T")[0] : ""}
            register={register}
            error={errors.birthday}
          />
          <InputField
            label="Blood Type"
            name="bloodType"
            defaultValue={data?.bloodType}
            register={register}
            error={errors.bloodType}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Sex</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2.5 rounded-md text-sm w-full"
              {...register("sex")}
              defaultValue={data?.sex}
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            {errors.sex?.message && (
              <p className="text-xs text-red-400">{errors.sex.message.toString()}</p>
            )}
          </div>
          <InputField
            label="Monthly Salary (৳)"
            name="monthlySalary"
            type="number"
            defaultValue={data?.monthlySalary ?? ""}
            register={register}
            error={errors.monthlySalary}
          />
        </div>
      </section>

      {/* Subjects */}
      {subjects.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-600 mb-3 pb-1 border-b border-gray-100">
            Assigned Subjects
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {subjects.map((subject) => (
              <label
                key={subject.id}
                className="flex items-start gap-2.5 p-2.5 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-100 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  value={String(subject.id)}
                  {...register("subjects")}
                  defaultChecked={data?.subjects?.includes(String(subject.id))}
                  className="mt-0.5 accent-blue-700"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-700 truncate">{subject.name}</span>
                  <span className="text-xs text-slate-400">Class {subject.class.name}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.subjects?.message && (
            <p className="text-xs text-red-400 mt-1">{errors.subjects.message.toString()}</p>
          )}
        </section>
      )}

      {data && <input type="hidden" {...register("id")} defaultValue={data.id} />}

      {state.error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          Something went wrong. Please check all fields and try again.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
      >
        {isSubmitting
          ? type === "create" ? "Creating..." : "Saving..."
          : type === "create" ? "Add Teacher" : "Save Changes"}
      </button>
    </form>
  );
};

export default TeacherForm;
