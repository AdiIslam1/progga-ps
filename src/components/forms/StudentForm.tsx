"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { studentSchema, StudentSchema } from "@/lib/formValidationSchemas";
import { createStudent, updateStudent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const StudentForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
  });

  const [img, setImg] = useState<any>(data?.img ? { secure_url: data.img } : null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { classes = [] } = relatedData || {};

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok) {
        setImg({ secure_url: json.url });
      } else {
        toast.error(json.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = handleSubmit(async (formData) => {
    setSubmitting(true);
    setServerError(false);
    try {
      if (type === "create") {
        const result = await createStudent(
          { success: false, error: false },
          { ...formData, img: img?.secure_url }
        );
        if (result.success && result.id) {
          toast("Student created successfully!");
          setOpen(false);
          router.push(`/list/students/${result.id}`);
        } else {
          setServerError(true);
        }
      } else {
        const result = await updateStudent(
          { success: false, error: false },
          { ...formData, img: img?.secure_url }
        );
        if (result.success) {
          toast("Student updated successfully!");
          setOpen(false);
          router.refresh();
        } else {
          setServerError(true);
        }
      }
    } catch {
      setServerError(true);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Add New Student" : "Update Student"}
      </h1>

      {type === "create" && (
        <p className="text-xs text-blue-500 bg-blue-50 border border-blue-100 rounded-md p-3">
          Student ID and password are auto-generated on creation. The student logs in using their ID.
        </p>
      )}

      {/* Personal info section */}
      <section>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
          Personal Information
        </p>

        {/* Photo upload */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
            {img?.secure_url ? (
              <img src={img.secure_url} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Image src="/noAvatar.png" alt="" width={64} height={64} className="w-full h-full object-cover" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-700 border border-blue-300 hover:border-blue-500 rounded-md px-3 py-2 transition-colors disabled:opacity-50"
          >
            <Image src="/upload.png" alt="" width={16} height={16} />
            {uploading ? "Uploading…" : img?.secure_url ? "Change Photo" : "Upload Photo"}
          </button>
          {img?.secure_url && (
            <button type="button" onClick={() => { setImg(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-xs text-red-400 hover:text-red-600">
              Remove
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="First Name"
            name="name"
            defaultValue={data?.name}
            register={register}
            error={errors.name}
          />
          <InputField
            label="Last Name"
            name="surname"
            defaultValue={data?.surname}
            register={register}
            error={errors.surname}
          />
          <InputField
            label="Phone"
            name="phone"
            defaultValue={data?.phone}
            register={register}
            error={errors.phone}
          />
          <InputField
            label="Address"
            name="address"
            defaultValue={data?.address}
            register={register}
            error={errors.address}
          />
          <InputField
            label="Birthday"
            name="birthday"
            defaultValue={data?.birthday ? new Date(data.birthday).toISOString().split("T")[0] : ""}
            register={register}
            error={errors.birthday}
            type="date"
          />

          {/* Blood Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Blood Type</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("bloodType")}
              defaultValue={data?.bloodType || ""}
            >
              <option value="">Select blood type</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
            {errors.bloodType?.message && (
              <p className="text-xs text-red-400">{errors.bloodType.message}</p>
            )}
          </div>

          {/* Sex */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Gender</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("sex")}
              defaultValue={data?.sex}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            {errors.sex?.message && (
              <p className="text-xs text-red-400">{errors.sex.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Academic section */}
      <section>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
          Academic Details
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Class */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Class</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("classId")}
              defaultValue={data?.classId}
            >
              <option value="">Select class</option>
              {classes.map(
                (cls: {
                  id: number;
                  name: string;
                  capacity: number;
                  _count: { students: number };
                }) => (
                  <option value={cls.id} key={cls.id}>
                    Class {cls.name} — {cls._count.students}/{cls.capacity} seats
                  </option>
                )
              )}
            </select>
            {errors.classId?.message && (
              <p className="text-xs text-red-400">{errors.classId.message}</p>
            )}
          </div>

          {/* Custom Tuition Fee */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">
              Custom Tuition Fee <span className="text-gray-400 font-normal">(leave blank for class default)</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 800"
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("customTuitionFee")}
              defaultValue={data?.customTuitionFee ?? ""}
            />
            {errors.customTuitionFee?.message && (
              <p className="text-xs text-red-400">{String(errors.customTuitionFee.message)}</p>
            )}
          </div>

          <InputField
            label="Guardian Name"
            name="guardianName"
            defaultValue={data?.guardianName}
            register={register}
            error={errors.guardianName}
          />
          <InputField
            label="Guardian Phone"
            name="guardianPhone"
            defaultValue={data?.guardianPhone}
            register={register}
            error={errors.guardianPhone}
          />
        </div>
      </section>

      {data && (
        <input type="hidden" {...register("id")} defaultValue={data.id} />
      )}

      {serverError && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3">
          Something went wrong. Please check all fields and try again.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white p-2 rounded-md font-medium transition-colors"
      >
        {submitting
          ? type === "create" ? "Creating..." : "Saving..."
          : type === "create" ? "Create Student" : "Save Changes"}
      </button>
    </form>
  );
};

export default StudentForm;
