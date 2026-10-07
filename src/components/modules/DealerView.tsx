import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../lib/auth';
import { softDeleteRecord, logAudit } from '../../lib/dataService';
import { Language, translations } from '../../lib/i18n';
import { Users, Plus, Phone, MapPin, Trash2, X, Building, CreditCard, FileCheck } from 'lucide-react';

interface DealershipFormItem {
  id: string;
  center: string;
  tas: string;
  shopOpeningDate: string;
  dealerCode: string;
  village: string;
  securityDeposit: string;
  firmName: string;
  proprietorName: string;
  contactNumber: string;
  state: string;
  emailId: string;
  responsiblePerson: string;
  responsibleContact: string;
  aadhaarNo: string;
  district: string;
  panNo: string;
  dateOfBirth: string;
  gstNo: string;
  pinCode: string;
  bankName: string;
  bankAddress: string;
  accountNo: string;
  ifscCode: string;
  chequeNos: string;
  isArchived?: boolean;
}

interface Props {
  profile: UserProfile;
  lang: Language;
}

export const DealerView: React.FC<Props> = ({ profile, lang }) => {
  const t = translations[lang];
  const [dealers, setDealers] = useState<DealershipFormItem[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form State matching Dealership Application Form
  const [center, setCenter] = useState('Sangli');
  const [tas, setTas] = useState('TAS');
  const [shopOpeningDate, setShopOpeningDate] = useState('2021-09-04');
  const [dealerCode, setDealerCode] = useState('DEALER-004');
  const [village, setVillage] = useState('BALAGAVADE');
  const [securityDeposit, setSecurityDeposit] = useState('NA');
  const [firmName, setFirmName] = useState('VIGHNAHARTA AGRO AGENCY BALGAVADE');
  const [proprietorName, setProprietorName] = useState('MONALI SUBHASH KHARADE');
  const [contactNumber, setContactNumber] = useState('9970337506');
  const [state, setState] = useState('Maharashtra');
  const [emailId, setEmailId] = useState('sachinkharade.dtis@gmail.com');
  const [responsiblePerson, setResponsiblePerson] = useState('SACHIN SUBHASH KHARADE');
  const [responsibleContact, setResponsibleContact] = useState('9970337506');
  const [aadhaarNo, setAadhaarNo] = useState('208034361547');
  const [district, setDistrict] = useState('SANGLI');
  const [panNo, setPanNo] = useState('JYCPK2123M');
  const [dateOfBirth, setDateOfBirth] = useState('1996-04-15');
  const [gstNo, setGstNo] = useState('27JYCPK2123M1Z8');
  const [pinCode, setPinCode] = useState('416312');
  const [bankName, setBankName] = useState('BANK OF MAHARASHTRA');
  const [bankAddress, setBankAddress] = useState('C.S.C.NO.8, GROUND FLOOR, MANJARDE');
  const [accountNo, setAccountNo] = useState('60396495517');
  const [ifscCode, setIfscCode] = useState('MAHB0000819');
  const [chequeNos, setChequeNos] = useState('027418 - 027419');

  useEffect(() => {
    const q = query(collection(db, 'dealers_application'));
    const unsub = onSnapshot(q, (snap) => {
      const list: DealershipFormItem[] = [];
      snap.forEach(d => {
        const data = d.data() as DealershipFormItem;
        if (!data.isArchived) list.push({ id: d.id, ...data });
      });

      if (list.length === 0) {
        seedInitialDealer(profile);
      } else {
        setDealers(list);
      }
    });
    return () => unsub();
  }, [profile]);

  const seedInitialDealer = async (user: UserProfile) => {
    const id = `dealer_app_init`;
    const defaultDealer: DealershipFormItem = {
      id,
      center,
      tas,
      shopOpeningDate,
      dealerCode,
      village,
      securityDeposit,
      firmName,
      proprietorName,
      contactNumber,
      state,
      emailId,
      responsiblePerson,
      responsibleContact,
      aadhaarNo,
      district,
      panNo,
      dateOfBirth,
      gstNo,
      pinCode,
      bankName,
      bankAddress,
      accountNo,
      ifscCode,
      chequeNos,
      isArchived: false,
    };
    await setDoc(doc(db, 'dealers_application', id), defaultDealer);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `dealer_${Date.now()}`;
    const newItem: DealershipFormItem = {
      id,
      center,
      tas,
      shopOpeningDate,
      dealerCode: dealerCode.trim(),
      village: village.trim(),
      securityDeposit,
      firmName: firmName.trim(),
      proprietorName: proprietorName.trim(),
      contactNumber: contactNumber.trim(),
      state,
      emailId: emailId.trim(),
      responsiblePerson: responsiblePerson.trim(),
      responsibleContact: responsibleContact.trim(),
      aadhaarNo: aadhaarNo.trim(),
      district: district.trim(),
      panNo: panNo.trim(),
      dateOfBirth,
      gstNo: gstNo.trim(),
      pinCode: pinCode.trim(),
      bankName: bankName.trim(),
      bankAddress: bankAddress.trim(),
      accountNo: accountNo.trim(),
      ifscCode: ifscCode.trim(),
      chequeNos: chequeNos.trim(),
      isArchived: false,
    };

    await setDoc(doc(db, 'dealers_application', id), newItem);
    await logAudit('CREATE', 'dealers_application', id, `Added Dealership Form for ${newItem.firmName}`, profile);

    setShowModal(false);
  };

  const handleDelete = async (item: DealershipFormItem) => {
    if (window.confirm(t.confirmDelete)) {
      await softDeleteRecord('dealers_application', item.id, item, profile);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-6 h-6 text-rose-600" />
            {t.dealer} (APPLICATION FOR DEALERSHIP)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">डीलर्स अर्ज, बँक तपशील व फर्म रेकॉर्ड्स</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>नवीन डीलर अर्ज जोडा</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dealers.map(d => (
          <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                  Code: {d.dealerCode}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1.5">{d.firmName}</h3>
                <p className="text-xs text-slate-600 font-medium">संचालक: {d.proprietorName}</p>
              </div>
              <button onClick={() => handleDelete(d)} className="text-slate-400 hover:text-rose-600 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100 text-slate-600">
              <div><strong>गावक/Village:</strong> {d.village}</div>
              <div><strong>जिल्हा/District:</strong> {d.district}</div>
              <div><strong>मोबाईल:</strong> {d.contactNumber}</div>
              <div><strong>GST No:</strong> {d.gstNo}</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                <span>बँक: {d.bankName}</span>
              </div>
              <p className="text-[11px] text-slate-500">Account No: {d.accountNo} | IFSC: {d.ifscCode}</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">APPLICATION FOR DEALERSHIP</h3>
                <p className="text-xs text-slate-500">Blackworm Agritech Pvt Ltd Dealership Form</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Center</label>
                  <input type="text" value={center} onChange={(e) => setCenter(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dealer Code</label>
                  <input type="text" value={dealerCode} onChange={(e) => setDealerCode(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Village</label>
                  <input type="text" value={village} onChange={(e) => setVillage(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Firm Name (फर्मचे नाव) *</label>
                <input type="text" required value={firmName} onChange={(e) => setFirmName(e.target.value)} className="w-full px-3 py-2 border rounded-xl font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Proprietor Name (संचालक) *</label>
                  <input type="text" required value={proprietorName} onChange={(e) => setProprietorName(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Number *</label>
                  <input type="tel" required value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email ID</label>
                  <input type="email" value={emailId} onChange={(e) => setEmailId(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Aadhaar No</label>
                  <input type="text" value={aadhaarNo} onChange={(e) => setAadhaarNo(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PAN No</label>
                  <input type="text" value={panNo} onChange={(e) => setPanNo(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">GST No</label>
                  <input type="text" value={gstNo} onChange={(e) => setGstNo(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">District</label>
                  <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pin Code</label>
                  <input type="text" value={pinCode} onChange={(e) => setPinCode(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>

              <div className="border-t pt-3 font-bold text-slate-800">BANK DETAILS</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bank Name</label>
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Account No</label>
                  <input type="text" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">IFSC Code</label>
                  <input type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Security Cheque Nos</label>
                  <input type="text" value={chequeNos} onChange={(e) => setChequeNos(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border font-bold text-slate-600">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-white">{t.save} Dealership Form</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
