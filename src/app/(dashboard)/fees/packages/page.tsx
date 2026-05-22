import prisma from "@/lib/prisma";
import PackageForm from "./PackageForm";
import DeletePackageBtn from "./DeletePackageBtn";
import { auth } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function FeePackagesPage() {
  const { role } = await auth();

  // Route protection - Only Admin can access Fee Packages list & creator
  if (role !== "admin") {
    redirect("/");
  }

  // Fetch all packages with their associated classes
  const packages = await prisma.feePackage.findMany({
    include: {
      class: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  // Fetch classes to pass into the package creator form
  const classes = await prisma.class.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="p-6 flex flex-col gap-6 lg:flex-row min-h-screen bg-[#f8fafe]">
      {/* LEFT - LIST OF FEE PACKAGES */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Standard Fee Packages</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage standard tuition rates and automatic bill packages for different grades.</p>
          </div>
          <span className="bg-lamaSkyLight text-lamaSky font-bold text-xs px-3 py-1.5 rounded-full shadow-sm">
            {packages.length} Total Packages
          </span>
        </div>

        {packages.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-lamaYellowLight flex items-center justify-center text-lamaYellow font-bold text-xl">৳</div>
            <p className="text-gray-500 font-semibold text-sm">No packages created yet</p>
            <p className="text-xs text-gray-400 max-w-xs">Use the creator form on the right to configure your first standard monthly tuition fee package.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-lamaYellow opacity-80" />

                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      pkg.class ? "bg-lamaSkyLight text-lamaSky" : "bg-lamaPurpleLight text-lamaPurple"
                    }`}>
                      {pkg.class ? `Class ${pkg.class.name}` : "School-Wide"}
                    </span>
                    <DeletePackageBtn id={pkg.id} name={pkg.name} />
                  </div>

                  <h3 className="text-base font-bold text-gray-800 mt-2.5 group-hover:text-lamaSky transition-colors duration-250">
                    {pkg.name}
                  </h3>

                  {pkg.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {pkg.description}
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-50 pt-3 mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Monthly Billing Rate</span>
                  <span className="text-lg font-extrabold text-gray-900 flex items-center gap-0.5">
                    <span className="text-sm font-semibold text-lamaSky">৳</span>
                    {pkg.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT - CREATE PACKAGE SIDEBAR FORM */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        <PackageForm classes={classes} />
      </div>
    </div>
  );
}
