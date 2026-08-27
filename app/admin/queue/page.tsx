'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlatform } from '@/lib/context/PlatformContext';
import RoleGuard from '@/components/RoleGuard';
import { Hospital, HospitalStatus } from '@/lib/types';

export default function AdminQueuePage() {
  const { hospitals, approveHospital, rejectHospital } = usePlatform();

  const [tabFilter, setTabFilter] = useState<'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' | 'ALL'>('PENDING_REVIEW');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [rejectingHospitalId, setRejectingHospitalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Inadequate OT recovery facility or incomplete documentation.');

  const pendingCount = hospitals.filter(h => h.status === 'PENDING_REVIEW').length;
  const verifiedCount = hospitals.filter(h => h.status === 'VERIFIED').length;
  const rejectedCount = hospitals.filter(h => h.status === 'REJECTED').length;

  const filteredHospitals = hospitals.filter(h => {
    if (tabFilter === 'ALL') return true;
    return h.status === tabFilter;
  });

  const handleApprove = (hospId: string) => {
    approveHospital(hospId);
    if (selectedHospital?.id === hospId) setSelectedHospital(null);
  };

  const handleReject = (hospId: string) => {
    rejectHospital(hospId, rejectReason);
    setRejectingHospitalId(null);
    if (selectedHospital?.id === hospId) setSelectedHospital(null);
  };

  return (
    <RoleGuard requiredRole="ADMIN" requireVerifiedHospital={false}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
              <Link href="/" className="hover:underline">Home</Link>
              <span>/</span>
              <span className="text-on-surface font-semibold">NOTTO National Accreditation Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight flex items-center gap-3">
              <span>Hospital Verification Queue</span>
              {pendingCount > 0 && (
                <span className="text-xs font-bold bg-tertiary text-on-tertiary px-3 py-1 rounded-full animate-pulse">
                  {pendingCount} Pending Review
                </span>
              )}
            </h1>
          </div>

          <div className="text-xs text-on-surface-variant text-right">
            <span>Governance: </span>
            <strong className="text-on-surface font-semibold">National Organ Transplant Organization</strong>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30 text-xs font-semibold max-w-fit">
          <button
            onClick={() => setTabFilter('PENDING_REVIEW')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              tabFilter === 'PENDING_REVIEW'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>Pending Review</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              tabFilter === 'PENDING_REVIEW' ? 'bg-white/20 text-white' : 'bg-surface-container-highest text-on-surface'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setTabFilter('VERIFIED')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              tabFilter === 'VERIFIED'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>Verified Centers</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-highest text-on-surface">
              {verifiedCount}
            </span>
          </button>

          <button
            onClick={() => setTabFilter('REJECTED')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              tabFilter === 'REJECTED'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>Rejected</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-highest text-on-surface">
              {rejectedCount}
            </span>
          </button>

          <button
            onClick={() => setTabFilter('ALL')}
            className={`px-4 py-2 rounded-xl transition-all ${
              tabFilter === 'ALL'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All ({hospitals.length})
          </button>
        </div>

        {/* Hospital Queue List */}
        {filteredHospitals.length === 0 ? (
          <div className="p-12 rounded-2xl bg-surface-container-low text-center border border-outline-variant/30 space-y-3">
            <span className="material-symbols-outlined text-outline text-[48px]">how_to_reg</span>
            <h3 className="text-base font-semibold text-on-surface">No Applications in this Queue</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              There are currently no hospital registration dossiers matching this status.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHospitals.map(hosp => {
              const isPending = hosp.status === 'PENDING_REVIEW';
              const isVerified = hosp.status === 'VERIFIED';
              const isRejected = hosp.status === 'REJECTED';

              return (
                <div
                  key={hosp.id}
                  className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-2xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[26px]">local_hospital</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h2 className="text-base sm:text-lg font-bold text-on-surface">{hosp.name}</h2>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              isVerified
                                ? 'bg-primary/15 text-primary'
                                : isPending
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'bg-error-container text-on-error-container'
                            }`}
                          >
                            {hosp.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-mono">
                          Ref: #{hosp.licenseNumber} • {hosp.city}, {hosp.state}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedHospital(hosp)}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 self-start sm:self-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      Inspect Documents ({hosp.documents.length})
                    </button>
                  </div>

                  {/* Contact & Facility Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-surface-container-low p-3.5 rounded-2xl">
                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                        Transplant Admin
                      </span>
                      <span className="font-semibold text-on-surface">{hosp.adminContact.name}</span>
                      <span className="text-[11px] text-on-surface-variant block">{hosp.adminContact.designation}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                        Communication
                      </span>
                      <span className="text-on-surface truncate block">{hosp.adminContact.email}</span>
                      <span className="text-on-surface-variant font-mono">{hosp.adminContact.phone}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                        Classification
                      </span>
                      <span className="font-semibold text-primary">{hosp.hospitalType.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  {/* Rejection notice if present */}
                  {hosp.rejectionReason && (
                    <div className="p-3 bg-error-container/40 rounded-xl border border-error/20 text-xs">
                      <span className="font-bold text-error block mb-0.5">Rejection Rationale:</span>
                      <p className="text-on-surface leading-relaxed">{hosp.rejectionReason}</p>
                    </div>
                  )}

                  {/* Actions for Pending Hospitals */}
                  {isPending && (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => setRejectingHospitalId(hosp.id)}
                        className="bg-surface-container-high hover:bg-surface-dim text-error font-semibold text-xs py-2.5 px-5 rounded-full transition-colors border border-outline-variant/30 flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                        Reject Application
                      </button>
                      <button
                        onClick={() => handleApprove(hosp.id)}
                        className="bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs py-2.5 px-6 rounded-full shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        Approve & Verify Hospital
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal 1: Inspect Dossier Modal */}
        {selectedHospital && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-outline-variant/30 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">{selectedHospital.name}</h3>
                  <span className="text-xs text-on-surface-variant font-mono">Dossier #{selectedHospital.licenseNumber}</span>
                </div>
                <button
                  onClick={() => setSelectedHospital(null)}
                  className="text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-on-surface uppercase tracking-wider text-[11px]">
                  Uploaded Compliance Documents
                </h4>
                <div className="space-y-2">
                  {selectedHospital.documents.map((doc, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-primary text-[22px]">picture_as_pdf</span>
                        <div>
                          <span className="font-semibold text-on-surface block">{doc.name}</span>
                          <span className="text-[10px] text-on-surface-variant">{doc.size} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                        Verified Valid
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
                <button
                  onClick={() => setSelectedHospital(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Close
                </button>
                {selectedHospital.status === 'PENDING_REVIEW' && (
                  <button
                    onClick={() => handleApprove(selectedHospital.id)}
                    className="bg-primary text-on-primary text-xs font-semibold px-5 py-2.5 rounded-full shadow-xs"
                  >
                    Approve Hospital
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Rejection Reason Dialog */}
        {rejectingHospitalId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-md w-full border border-outline-variant/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <h3 className="text-base font-bold text-on-surface">Reject Hospital Accreditation</h3>
                <button
                  onClick={() => setRejectingHospitalId(null)}
                  className="text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                Please provide the compliance reason for rejecting this hospital application. The hospital coordinator will see this feedback in their status portal.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1.5">
                  Rejection Reason (Required)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full p-3 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs text-on-surface focus:ring-2 focus:ring-primary/40 focus:outline-none"
                  placeholder="e.g. Inadequate modular OT recovery facility under NOTTO standards..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectingHospitalId(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(rejectingHospitalId)}
                  className="bg-error text-on-error hover:bg-error/90 text-xs font-semibold px-5 py-2 rounded-full shadow-xs transition-all"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
