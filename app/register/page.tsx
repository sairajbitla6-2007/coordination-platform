'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlatform } from '@/lib/context/PlatformContext';

export default function HospitalRegistrationPage() {
  const router = useRouter();
  const { registerHospital } = usePlatform();

  const [name, setName] = useState('Memorial Regional Transplant Center');
  const [licenseNumber, setLicenseNumber] = useState('NOTTO-KA-2026-9921');
  const [hospitalType, setHospitalType] = useState<'TRANSPLANT_CENTER' | 'RECOVERY_CENTER' | 'SPECIALTY_HOSPITAL'>('TRANSPLANT_CENTER');
  const [address, setAddress] = useState('44 Medical Innovation Campus, Outer Ring Road');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('560103');

  const [contactName, setContactName] = useState('Dr. Sanjay Varma, MS, MCh');
  const [contactEmail, setContactEmail] = useState('sanjay.varma@memorialhealth.org');
  const [contactPhone, setContactPhone] = useState('+91 98451 22334');
  const [contactDesignation, setContactDesignation] = useState('Transplant Director');

  const [files, setFiles] = useState<{ name: string; size: string }[]>([
    { name: 'NOTTO_Facility_Licensing_Application.pdf', size: '2.4 MB' },
    { name: 'NABH_Accreditation_Certificate.pdf', size: '1.8 MB' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await registerHospital({
        name,
        licenseNumber,
        hospitalType,
        address,
        city,
        state,
        pincode,
        adminContact: {
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          designation: contactDesignation
        },
        documents: files.map((f, idx) => ({
          id: `doc-${idx + 1}`,
          name: f.name,
          type: 'application/pdf',
          size: f.size,
          uploadedAt: new Date().toISOString()
        }))
      });

      router.push('/pending-review');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleMockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFiles(prev => [
        ...prev,
        {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        }
      ]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mb-3"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Home
        </Link>
        <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full block w-fit mb-2">
          Hospital Onboarding
        </span>
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">
          Register Hospital Facility
        </h1>
        <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
          Join the verified NOTTO network for secure, life-saving organ coordination.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm space-y-6">
        {/* Section 1: Facility Details */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary pb-1 border-b border-outline-variant/20">
            1. Facility Identification
          </h2>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Hospital Legal Name <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                local_hospital
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Apollo Medical Center"
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                NOTTO / State License Number <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  badge
                </span>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  placeholder="LIC-0000000"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 font-mono text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Center Classification <span className="text-error">*</span>
              </label>
              <select
                value={hospitalType}
                onChange={e => setHospitalType(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="TRANSPLANT_CENTER">Level 1 Multi-Organ Transplant Center</option>
                <option value="RECOVERY_CENTER">Organ Recovery & Perfusion Center</option>
                <option value="SPECIALTY_HOSPITAL">Specialty Surgical Hospital</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Physical Facility Address <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-[20px]">
                location_on
              </span>
              <textarea
                rows={2}
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Street address, Medical district..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">State</label>
              <input
                type="text"
                required
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">Pincode</label>
              <input
                type="text"
                required
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/40 font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Primary Administrator Contact */}
        <div className="space-y-4 pt-4 border-t border-outline-variant/20">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary pb-1 border-b border-outline-variant/20">
            2. Chief Transplant Coordinator Contact
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Full Name & Degrees <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs sm:text-sm text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Designation <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={contactDesignation}
                onChange={e => setContactDesignation(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs sm:text-sm text-on-surface focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Institutional Email <span className="text-error">*</span>
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs sm:text-sm text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Emergency 24x7 Phone <span className="text-error">*</span>
              </label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs sm:text-sm text-on-surface font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Document Uploads */}
        <div className="space-y-4 pt-4 border-t border-outline-variant/20">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              3. Verification Documents
            </h2>
            <span className="text-[11px] text-on-surface-variant font-semibold">Mandatory PDF Attachments</span>
          </div>

          {/* Upload Dropzone */}
          <div className="bg-surface-container-low border-2 border-dashed border-outline-variant/50 rounded-2xl p-6 text-center hover:bg-surface-container transition-colors relative cursor-pointer group">
            <input
              type="file"
              accept=".pdf,.jpg,.png"
              onChange={handleMockUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">upload_file</span>
            </div>
            <p className="text-xs font-bold text-on-surface">Click to attach accreditation certificates</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">NOTTO License, NABH/JCI Certificate (PDF, Max 10MB)</p>
          </div>

          {/* Attached Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container text-xs border border-outline-variant/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">picture_as_pdf</span>
                    <span className="font-semibold text-on-surface">{file.name}</span>
                    <span className="text-on-surface-variant text-[11px]">({file.size})</span>
                  </div>
                  <span className="text-[11px] font-bold text-primary">Ready</span>
                </div>
              ))}
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3.5 bg-surface-container rounded-xl flex items-start gap-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">lock</span>
            <span>
              All submissions undergo manual inspection by the NOTTO compliance team. Upon submission, your hospital will transition to <strong>Pending Review</strong> until verified.
            </span>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-semibold px-8 py-3 rounded-full shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                Submitting Application...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                Submit Hospital for Verification
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
