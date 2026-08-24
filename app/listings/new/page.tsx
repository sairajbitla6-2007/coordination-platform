'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlatform } from '@/lib/context/PlatformContext';
import RoleGuard from '@/components/RoleGuard';
import { BloodType, HLATyping, ListingType, OrganType, UrgencyLevel } from '@/lib/types';
import { MAX_VIABILITY_HOURS } from '@/lib/matchingEngine';

export default function NewListingPage() {
  const router = useRouter();
  const { createListing, currentHospital } = usePlatform();

  // Step 1: Selector, Step 2: Form
  const [selectedType, setSelectedType] = useState<ListingType | null>(null);

  // Form States
  const [organType, setOrganType] = useState<OrganType>('Kidney');
  const [bloodType, setBloodType] = useState<BloodType>('O+');
  const [hlaA, setHlaA] = useState('02,24');
  const [hlaB, setHlaB] = useState('35,44');
  const [hlaDR, setHlaDR] = useState('04,07');

  // Donor fields
  const [donorAge, setDonorAge] = useState<number>(32);
  const [donorGender, setDonorGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [viabilityHours, setViabilityHours] = useState<number>(MAX_VIABILITY_HOURS['Kidney']);
  const [conditionNotes, setConditionNotes] = useState('Organ retrieved under stable perfusion protocol. Normal renal function prior to harvest.');
  const [donorCauseOfDeath, setDonorCauseOfDeath] = useState('Traumatic Brain Injury (Brain Dead Donor)');

  // Recipient fields
  const [recipientAge, setRecipientAge] = useState<number>(42);
  const [recipientGender, setRecipientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('1B_URGENT');
  const [medicalCenterWard, setMedicalCenterWard] = useState('Transplant ICU Bed 3');
  const [recipientPatientId, setRecipientPatientId] = useState(`PT-${Math.floor(1000 + Math.random() * 9000)}`);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOrganChange = (newOrgan: OrganType) => {
    setOrganType(newOrgan);
    setViabilityHours(MAX_VIABILITY_HOURS[newOrgan] || 12);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    setIsSubmitting(true);

    const hlaParsed: HLATyping = {
      a: hlaA.split(',').map(s => s.trim().startsWith('A*') ? s.trim() : `A*${s.trim()}`).filter(Boolean),
      b: hlaB.split(',').map(s => s.trim().startsWith('B*') ? s.trim() : `B*${s.trim()}`).filter(Boolean),
      dr: hlaDR.split(',').map(s => s.trim().startsWith('DRB1*') ? s.trim() : `DRB1*${s.trim()}`).filter(Boolean)
    };

    try {
      const newListing = await createListing({
        type: selectedType,
        organType,
        bloodType,
        hlaTyping: hlaParsed,
        donorAge: selectedType === 'DONOR' ? donorAge : undefined,
        donorGender: selectedType === 'DONOR' ? donorGender : undefined,
        viabilityHours: selectedType === 'DONOR' ? viabilityHours : undefined,
        conditionNotes: selectedType === 'DONOR' ? conditionNotes : undefined,
        donorCauseOfDeath: selectedType === 'DONOR' ? donorCauseOfDeath : undefined,
        recipientAge: selectedType === 'RECIPIENT' ? recipientAge : undefined,
        recipientGender: selectedType === 'RECIPIENT' ? recipientGender : undefined,
        urgencyLevel: selectedType === 'RECIPIENT' ? urgencyLevel : undefined,
        medicalCenterWard: selectedType === 'RECIPIENT' ? medicalCenterWard : undefined,
        recipientPatientId: selectedType === 'RECIPIENT' ? recipientPatientId : undefined
      });

      router.push(`/listings/${newListing.id}/matches`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard requiredRole="HOSPITAL_USER" requireVerifiedHospital={true}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <span>/</span>
          <Link href="/listings" className="hover:underline">Listings</Link>
          <span>/</span>
          <span className="font-semibold text-on-surface">Add New Listing</span>
        </div>

        {/* Step 1: Type Selector */}
        {!selectedType ? (
          <div className="space-y-8 text-center py-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                Step 1 of 2: Listing Category
              </span>
              <h1 className="text-3xl font-bold text-on-surface mt-3 tracking-tight">
                Select Listing Type
              </h1>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto mt-2 leading-relaxed">
                Choose whether you are registering a retrieved deceased/living donor organ or adding a waiting transplant recipient.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
              {/* Donor Option */}
              <button
                onClick={() => setSelectedType('DONOR')}
                className="bg-surface-container-low hover:bg-surface-container rounded-2xl p-6 border-2 border-transparent hover:border-primary transition-all shadow-2xs hover:shadow-md flex flex-col justify-between group"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[32px]">volunteer_activism</span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">Donor Organ Listing</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Register a newly retrieved organ (Heart, Kidney, Liver, Lung) with cold ischemia viability window, HLA markers, and surgical notes.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Register Donor Organ</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </button>

              {/* Recipient Option */}
              <button
                onClick={() => setSelectedType('RECIPIENT')}
                className="bg-surface-container-low hover:bg-surface-container rounded-2xl p-6 border-2 border-transparent hover:border-secondary transition-all shadow-2xs hover:shadow-md flex flex-col justify-between group"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[32px]">inbox</span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">Recipient Patient Listing</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Enroll an active waitlist patient with urgency status (1A Critical, 1B Urgent), blood group, and HLA antibodies.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs font-semibold text-secondary">
                  <span>Register Recipient</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Form */
          <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {selectedType === 'DONOR' ? 'Donor Organ Registration' : 'Recipient Patient Registration'}
                </span>
                <h1 className="text-2xl font-bold text-on-surface mt-1">
                  {selectedType === 'DONOR' ? 'New Donor Organ Details' : 'New Recipient Waitlist Entry'}
                </h1>
              </div>
              <button
                onClick={() => setSelectedType(null)}
                className="text-xs font-semibold text-on-surface-variant hover:text-on-surface bg-surface-container px-3 py-1.5 rounded-lg"
              >
                Change Type
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Field 1: Organ Type (Required First Field) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">
                  Organ Type <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Cornea', 'Intestine'] as OrganType[]).map(org => {
                    const isSelected = organType === org;
                    return (
                      <button
                        type="button"
                        key={org}
                        onClick={() => handleOrganChange(org)}
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-primary text-on-primary border-primary shadow-xs'
                            : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-outline-variant/30'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {org === 'Heart'
                            ? 'favorite'
                            : org === 'Kidney'
                            ? 'grain'
                            : org === 'Liver'
                            ? 'medication'
                            : org === 'Lung'
                            ? 'air'
                            : 'vital_signs'}
                        </span>
                        {org}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 2: Blood Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">
                  Blood Group (ABO & Rh Factor) <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as BloodType[]).map(bt => {
                    const isSelected = bloodType === bt;
                    return (
                      <button
                        type="button"
                        key={bt}
                        onClick={() => setBloodType(bt)}
                        className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all text-center ${
                          isSelected
                            ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                            : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-outline-variant/30'
                        }`}
                      >
                        {bt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* HLA Typing Grid */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                    HLA Typing Alleles
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-mono">Comma-separated digits</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-on-surface-variant mb-1">HLA-A Locus</label>
                    <input
                      type="text"
                      value={hlaA}
                      onChange={e => setHlaA(e.target.value)}
                      placeholder="02, 24"
                      className="w-full px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 font-mono focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-on-surface-variant mb-1">HLA-B Locus</label>
                    <input
                      type="text"
                      value={hlaB}
                      onChange={e => setHlaB(e.target.value)}
                      placeholder="35, 44"
                      className="w-full px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 font-mono focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-on-surface-variant mb-1">HLA-DR Locus</label>
                    <input
                      type="text"
                      value={hlaDR}
                      onChange={e => setHlaDR(e.target.value)}
                      placeholder="04, 07"
                      className="w-full px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/40 font-mono focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Conditional Fields based on DONOR vs RECIPIENT */}
              {selectedType === 'DONOR' ? (
                <div className="space-y-4 pt-2 border-t border-outline-variant/20">
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                    Donor & Viability Specification
                  </h3>

                  {/* Viability Window Hard Cutoff */}
                  <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-error uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">timer</span>
                        Cold Ischemia Viability Limit (Hard Deadline) <span className="text-error">*</span>
                      </label>
                      <span className="text-xs font-bold text-error tabular-nums">
                        {viabilityHours} Hours Max
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={MAX_VIABILITY_HOURS[organType] * 1.5}
                      value={viabilityHours}
                      onChange={e => setViabilityHours(Number(e.target.value))}
                      className="w-full accent-error"
                    />
                    <p className="text-[11px] text-on-error-container/80">
                      Standard medical protocol requires cross-clamping and transplant within <strong>{MAX_VIABILITY_HOURS[organType]} hours</strong> for {organType}.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-medium text-on-surface-variant mb-1">Donor Age</label>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={donorAge}
                        onChange={e => setDonorAge(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/40 focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-on-surface-variant mb-1">Donor Gender</label>
                      <select
                        value={donorGender}
                        onChange={e => setDonorGender(e.target.value as any)}
                        className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/40 focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Donor Cause of Death</label>
                    <input
                      type="text"
                      value={donorCauseOfDeath}
                      onChange={e => setDonorCauseOfDeath(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/40 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Condition & Retrieval Notes</label>
                    <textarea
                      rows={2}
                      value={conditionNotes}
                      onChange={e => setConditionNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/40 text-xs focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2 border-t border-outline-variant/20">
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                    Recipient Urgency & Center Details
                  </h3>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">
                      Clinical Urgency Level <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { level: '1A_CRITICAL', label: 'Status 1A: Critical (ECMO / ICU)', color: 'border-error text-error' },
                        { level: '1B_URGENT', label: 'Status 1B: Urgent (Inotropic / Dialysis)', color: 'border-tertiary text-tertiary' },
                        { level: '2_STANDARD', label: 'Status 2: Standard Waitlist', color: 'border-outline-variant text-on-surface' }
                      ].map(item => {
                        const isSelected = urgencyLevel === item.level;
                        return (
                          <button
                            type="button"
                            key={item.level}
                            onClick={() => setUrgencyLevel(item.level as UrgencyLevel)}
                            className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                              isSelected
                                ? 'bg-surface-container-high border-primary ring-2 ring-primary/30 shadow-xs'
                                : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/30 text-on-surface'
                            }`}
                          >
                            <span className="block font-bold">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-on-surface-variant mb-1">Patient ID / MRN</label>
                      <input
                        type="text"
                        value={recipientPatientId}
                        onChange={e => setRecipientPatientId(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/40 font-mono focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-on-surface-variant mb-1">Recipient Age</label>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={recipientAge}
                        onChange={e => setRecipientAge(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/40 focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-on-surface-variant mb-1">Medical Ward / Unit</label>
                      <input
                        type="text"
                        value={medicalCenterWard}
                        onChange={e => setMedicalCenterWard(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/40 focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-3">
                <Link
                  href="/listings"
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
                      Processing AI Matching...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">publish</span>
                      Submit Listing & Find Matches
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
