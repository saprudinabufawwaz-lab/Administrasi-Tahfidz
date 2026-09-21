const cfg=window.SUPABASE_CONFIG||{}; const configured=cfg.url&&cfg.url.includes('supabase.co')&&cfg.anonKey&&cfg.anonKey!=='YOUR_SUPABASE_ANON_PUBLIC_KEY';
let sb=null,current=null,settings={institution_name:'Administrasi Tahfidz',logo_url:'',theme:'emerald'},cache={profiles:[],classes:[],halaqoh:[],examiners:[],teacherHalaqoh:[],teacherClass:[],students:[],journals:[],reports:[],exams:[]};
const $=id=>document.getElementById(id); const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const themes={emerald:{dark:'bg-emerald-900',mid:'bg-emerald-800',accent:'bg-emerald-600',hover:'hover:bg-emerald-800',light:'bg-emerald-100',text:'text-emerald-700'},blue:{dark:'bg-blue-900',mid:'bg-blue-800',accent:'bg-blue-600',hover:'hover:bg-blue-800',light:'bg-blue-100',text:'text-blue-700'},purple:{dark:'bg-purple-900',mid:'bg-purple-800',accent:'bg-purple-600',hover:'hover:bg-purple-800',light:'bg-purple-100',text:'text-purple-700'},amber:{dark:'bg-amber-900',mid:'bg-amber-800',accent:'bg-amber-600',hover:'hover:bg-amber-800',light:'bg-amber-100',text:'text-amber-700'},rose:{dark:'bg-rose-900',mid:'bg-rose-800',accent:'bg-rose-600',hover:'hover:bg-rose-800',light:'bg-rose-100',text:'text-rose-700'}};
function toast(msg,type='ok'){const t=$('toast');t.textContent=msg;t.className=`fixed top-4 right-4 z-[100] max-w-sm rounded-xl px-4 py-3 text-sm shadow-lg ${type==='err'?'bg-red-600 text-white':'bg-emerald-600 text-white'}`;setTimeout(()=>t.classList.add('hidden'),3000)}
function showAuth(x){$('loginForm').classList.toggle('hidden',x!=='login');$('registerForm').classList.toggle('hidden',x!=='register');$('tabLogin').className=x==='login'?'flex-1 py-2 rounded-lg bg-emerald-600 text-white':'flex-1 py-2 rounded-lg bg-slate-100';$('tabRegister').className=x==='register'?'flex-1 py-2 rounded-lg bg-emerald-600 text-white':'flex-1 py-2 rounded-lg bg-slate-100'}
async function registerTeacher(e){e.preventDefault();if(!configured)return toast('Konfigurasi Supabase belum diisi','err');const nama=$('regName').value.trim(),email=$('regEmail').value.trim(),password=$('regPassword').value,halaqoh=$('regHalaqoh').value.trim();const {error}=await sb.auth.signUp({email,password,options:{data:{nama,halaqoh}}});if(error)return toast(error.message,'err');toast('Pendaftaran terkirim. Tunggu persetujuan Koordinator.');e.target.reset();showAuth('login')}
async function login(e){e.preventDefault();if(!configured)return toast('Konfigurasi Supabase belum diisi','err');const {data,error}=await sb.auth.signInWithPassword({email:$('loginEmail').value,password:$('loginPassword').value});if(error)return toast(error.message,'err');await start(data.user)}
async function loadSettings(){
  const {data,error}=await sb
    .from('app_settings')
    .select('*')
    .eq('id',1)
    .maybeSingle();

  if(!error && data){
    settings={
      ...settings,
      ...data
    };
    return;
  }

  if(current?.role==='koordinator'){
    const {data:d,error:e}=await sb
      .from('app_settings')
      .upsert({
        id:1,
        institution_name:settings.institution_name,
        logo_url:settings.logo_url,
        theme:settings.theme,
        updated_by:current.id
      },{
        onConflict:'id'
      })
      .select()
      .single();

    if(!e && d){
      settings={
        ...settings,
        ...d
      };
    }
  }
}
function applySettings(){
  const name = settings.institution_name || 'Administrasi Tahfidz';

  document.title = name;

  if($('docTitle')) $('docTitle').textContent = name;
  if($('loginInstitution')) $('loginInstitution').textContent = name;
  if($('mobileBrand')) $('mobileBrand').textContent = name;
  if($('sideBrand')) $('sideBrand').textContent = name;

  const logo = settings.logo_url;

  if(logo){
    ['loginLogo','sideLogo'].forEach(id=>{
      const el=$(id);
      if(el){
        el.src=logo;
        el.classList.remove('hidden');
      }
    });

    if($('loginLogoFallback')) $('loginLogoFallback').classList.add('hidden');
    if($('sideLogoFallback')) $('sideLogoFallback').classList.add('hidden');
  }else{
    ['loginLogo','sideLogo'].forEach(id=>{
      const el=$(id);
      if(el) el.classList.add('hidden');
    });

    if($('loginLogoFallback')) $('loginLogoFallback').classList.remove('hidden');
    if($('sideLogoFallback')) $('sideLogoFallback').classList.remove('hidden');
  }

  const th = themes[settings.theme] || themes.emerald;

  if($('sidebar')){
    $('sidebar').className =
      `fixed z-50 inset-y-0 left-0 w-72 ${th.dark} text-white p-5 transform -translate-x-full lg:translate-x-0 transition-transform`;
  }

  if($('mobileBrand') && $('mobileBrand').parentElement){
    $('mobileBrand').parentElement.className =
      `lg:hidden sticky top-0 z-40 ${th.mid} text-white p-3 flex items-center justify-between`;
  }
}
async function loadAll(){
  const tables = {
    profiles: 'profiles',
    classes: 'classes',
    halaqoh: 'halaqoh',
    examiners: 'examiners',
    teacherHalaqoh: 'teacher_halaqoh',
    teacherClass: 'teacher_class',
    students: 'students',
    journals: 'monthly_journals',
    reports: 'quarterly_reports',
    exams: 'exam_requests'
  };

  for(const [key, table] of Object.entries(tables)){
    const {data, error} = await sb
      .from(table)
      .select('*');

    if(error){
      console.warn('Gagal memuat', table, error);
      cache[key] = [];
    }else{
      cache[key] = data || [];
    }
  }
}
async function start(user){
  console.log('START 1 - mulai login', user);

  const {data:p,error}=await sb
    .from('profiles')
    .select('*')
    .eq('id',user.id)
    .single();

  console.log('START 2 - profile:', p, error);

  if(error || !p){
    return toast('Profil pengguna belum tersedia','err');
  }

  if(p.status !== 'approved'){
    return toast(
      'Akun belum disetujui Koordinator. Status: ' + p.status,
      'err'
    );
  }

  console.log('START 3 - profile approved');

  current=p;

  await loadSettings();
  console.log('START 4 - loadSettings selesai');

  $('login').classList.add('hidden');
  $('login').style.display='none';

  $('app').classList.remove('hidden');
  $('app').style.display='block';

  console.log('START 5 - dashboard diperintah tampil');

  $('sideUser').textContent=`${p.nama} • ${p.role}`;

  applySettings();
  console.log('START 6 - applySettings selesai');

  buildNav();
  console.log('START 7 - buildNav selesai');

  await loadAll();
  console.log('START 8 - loadAll selesai');

  go('home');
  console.log('START 9 - go home selesai');
}
function buildNav(){const isC=current.role==='koordinator';$('nav').innerHTML=`<button onclick="go('home')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">🏠 Beranda</button><button onclick="go('journal')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">📖 Jurnal Tahfidz Bulanan</button><button onclick="go('report')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">📊 Rekap 3 Bulan</button><button onclick="go('exam')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">🏅 Ujian Kenaikan Juz</button>${isC?`<button onclick="go('guru')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">👨‍🏫 Data Guru & Persetujuan</button><button onclick="go('settings')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">⚙️ Peraturan & Pengaturan</button><button onclick="go('student')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">👦 Data Murid</button>`:''}`}
function toggleSidebar(){$('sidebar').classList.toggle('-translate-x-full')}
let restoringHistory = false;

function go(page, pushHistory = true) {
  if (innerWidth < 1024) {
    $('sidebar').classList.add('-translate-x-full');
  }

  const map = {
    home: ['Beranda', 'Ringkasan sistem tahfidz'],
    journal: ['Jurnal Tahfidz Bulanan', 'Satu kali per bulan, berdasarkan halaqoh yang Anda ampu'],
    report: ['Rekap Tahfidz 3 Bulan', 'Diisi guru kelas atau partner wali kelas'],
    exam: ['Ujian Kenaikan Juz', 'Pengajuan dan verifikasi'],
    guru: ['Data Guru & Persetujuan', 'Akun, status, kelas, dan halaqoh guru'],
    settings: ['Peraturan & Pengaturan', 'Identitas lembaga, logo, tema, dan master data'],
    student: ['Data Murid', 'Nama murid, kelas, dan halaqoh']
  };

  if (!map[page]) return;

  $('pageTitle').textContent = map[page][0];
  $('pageSub').textContent = map[page][1];

  const fn = {
    home: home,
    journal: journal,
    report: report,
    exam: exam,
    guru: guru,
    settings: settingsPage,
    student: student
  }[page];

  $('content').innerHTML = fn();

  if (page === 'journal') bindJournal();
  if (page === 'report') bindReport();
  if (page === 'exam') bindExam();
  if (page === 'guru') bindGuru();
  if (page === 'settings') bindSettings();
  if (page === 'student') bindStudent();

  // Simpan halaman ke riwayat browser
  if (pushHistory && !restoringHistory) {
    history.pushState({ page }, '', '#' + page);
  }
}window.addEventListener('popstate', function(e) {
  const page = e.state?.page || location.hash.replace('#', '') || 'home';

  const map = {
    home: ['Beranda', 'Ringkasan sistem tahfidz'],
    journal: ['Jurnal Tahfidz Bulanan', 'Satu kali per bulan, berdasarkan halaqoh yang Anda ampu'],
    report: ['Rekap Tahfidz 3 Bulan', 'Diisi guru kelas atau partner wali kelas'],
    exam: ['Ujian Kenaikan Juz', 'Pengajuan dan verifikasi'],
    guru: ['Data Guru & Persetujuan', 'Akun, status, kelas, dan halaqoh guru'],
    settings: ['Peraturan & Pengaturan', 'Identitas lembaga, logo, tema, dan master data'],
    student: ['Data Murid', 'Nama murid, kelas, dan halaqoh']
  };

  const fn = {
    home: home,
    journal: journal,
    report: report,
    exam: exam,
    guru: guru,
    settings: settingsPage,
    student: student
  };

  if (!map[page] || !fn[page]) return;

  restoringHistory = true;

  $('pageTitle').textContent = map[page][0];
  $('pageSub').textContent = map[page][1];
  $('content').innerHTML = fn[page]();

  if (page === 'journal') bindJournal();
  if (page === 'report') bindReport();
  if (page === 'exam') bindExam();
  if (page === 'guru') bindGuru();
  if (page === 'settings') bindSettings();
  if (page === 'student') bindStudent();

  restoringHistory = false;
});
function home(){const pending=cache.profiles.filter(p=>p.status==='pending').length, jr=cache.journals.length, rp=cache.reports.length;return `<div class="grid md:grid-cols-3 gap-4"><div class="bg-white rounded-2xl p-5 shadow-sm"><div class="text-sm text-slate-500">Guru</div><div class="text-3xl font-bold">${cache.profiles.filter(p=>p.role==='guru').length}</div></div><div class="bg-white rounded-2xl p-5 shadow-sm"><div class="text-sm text-slate-500">Jurnal bulanan</div><div class="text-3xl font-bold">${jr}</div></div><div class="bg-white rounded-2xl p-5 shadow-sm"><div class="text-sm text-slate-500">Rekap 3 bulan</div><div class="text-3xl font-bold">${rp}</div></div></div>${current.role==='koordinator'?`<div class="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5"><b>${pending}</b> pendaftaran guru menunggu persetujuan.</div>`:''}<div class="mt-6 bg-white rounded-2xl p-6"><h3 class="font-bold mb-2">Alur data</h3><p class="text-sm text-slate-600">Guru pengampu mengisi jurnal bulanan → tiga jurnal membentuk rekap 3 bulan → guru kelas/partner mengisi evaluasi triwulan → pengajuan ujian diverifikasi Koordinator.</p></div>`}
function select(id,label,opts,placeholder='Pilih...'){return `<label class="block text-sm font-medium">${label}<select id="${id}" class="mt-1 w-full p-2.5 border rounded-lg"><option value="">${placeholder}</option>${opts.map(o=>`<option value="${o.id}">${esc(o.nama)}</option>`).join('')}</select></label>`}
function journal(){

  const ss = cache.students;

  const rows = cache.journals
    .filter(j => current.role === 'koordinator' || j.teacher_id === current.id);

  return `
    <div class="bg-white rounded-2xl p-5 shadow-sm">

      <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">

        <div>
          <b class="text-lg">Jurnal Tahfidz Bulanan</b>
          <p class="text-xs text-slate-500">
            Pilih halaqoh → murid. Tidak ada input nama manual.
          </p>
        </div>

        <button
          onclick="openJournal()"
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg">
          + Isi Jurnal
        </button>

      </div>

      <div class="overflow-x-auto">

        <table class="w-full text-sm">

          <thead>
            <tr class="bg-slate-50">
              <th class="p-3 text-left">Bulan</th>
              <th class="p-3 text-left">Murid</th>
              <th class="p-3 text-left">Kelas</th>
              <th class="p-3 text-left">Halaqoh</th>
              <th class="p-3 text-left">Hafalan</th>
              <th class="p-3 text-left">Catatan</th>
              <th class="p-3 text-left">Aksi</th>
            </tr>
          </thead>

          <tbody>

            ${
              rows.length
              ?
              rows.map(j => {

                const s = ss.find(x => x.id === j.student_id);

                const h = cache.halaqoh.find(
                  x => x.id === j.halaqoh_id
                );

                return `
                  <tr class="border-t hover:bg-slate-50">

                    <td class="p-3">
                      ${esc(j.month_start)}
                    </td>

                    <td class="p-3">
                      ${esc(s?.nama || '-')}
                    </td>

                    <td class="p-3">
                      ${esc(
                        cache.classes.find(
                          x => x.id === s?.class_id
                        )?.nama || '-'
                      )}
                    </td>

                    <td class="p-3">
                      ${esc(h?.nama || '-')}
                    </td>

                    <td class="p-3">
                      ${esc(j.hafalan || '-')}
                    </td>

                    <td class="p-3">
                      ${esc(j.catatan || '-')}
                    </td>

                    <td class="p-3 whitespace-nowrap">

                      <button
                        onclick="openJournal('${j.id}')"
                        class="text-blue-600 hover:underline mr-3">
                        ✏️ Edit
                      </button>

                      <button
                        onclick="deleteJournal('${j.id}')"
                        class="text-red-600 hover:underline">
                        🗑️ Hapus
                      </button>

                    </td>

                  </tr>
                `;

              }).join('')
              :
              `
                <tr>
                  <td
                    colspan="7"
                    class="p-6 text-center text-slate-500">
                    Belum ada jurnal.
                  </td>
                </tr>
              `
            }

          </tbody>

        </table>

      </div>

    </div>
  `;
}


function openJournal(id=''){

  const record = id
    ? cache.journals.find(x => x.id === id)
    : null;

  if(id && !record){
    return toast('Data jurnal tidak ditemukan','err');
  }

  const hs = current.role === 'koordinator'
    ? cache.halaqoh
    : cache.teacherHalaqoh
        .filter(x => x.teacher_id === current.id)
        .map(x =>
          cache.halaqoh.find(h => h.id === x.halaqoh_id)
        )
        .filter(Boolean);

  $('modalBox').innerHTML = `

    <h3 class="font-bold text-lg mb-4">
      ${record ? 'Edit Jurnal Bulanan' : 'Jurnal Bulanan'}
    </h3>

    <form
      onsubmit="saveJournal(event,'${id}')"
      class="space-y-4">

      ${select(
        'jh',
        'Halaqoh',
        hs,
        'Pilih halaqoh'
      )}

      <label class="block text-sm font-medium">

        Bulan

        <input
          id="jm"
          type="month"
          required
          class="mt-1 w-full p-2.5 border rounded-lg">

      </label>

      ${select(
        'js',
        'Nama Murid',
        [],
        'Pilih halaqoh terlebih dahulu'
      )}

      <input
        id="jhaf"
        required
        placeholder="Contoh: 3 halaman / Juz 30"
        class="w-full p-2.5 border rounded-lg">

      <textarea
        id="jcat"
        placeholder="Catatan"
        class="w-full p-2.5 border rounded-lg"></textarea>

      <div class="flex justify-end gap-2 pt-2">

        <button
          type="button"
          onclick="closeModal()"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg">
          Batal
        </button>

        <button
          type="submit"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
          ${record ? 'Simpan Perubahan' : 'Simpan'}
        </button>

      </div>

    </form>
  `;

  $('jh').onchange = () => {
    fillStudents('jh','js');
  };

  if(record){

    $('jh').value = record.halaqoh_id || '';

    fillStudents('jh','js');

    $('js').value = record.student_id || '';

    $('jm').value =
      record.month_start
        ? String(record.month_start).slice(0,7)
        : '';

    $('jhaf').value =
      record.hafalan || '';

    $('jcat').value =
      record.catatan || '';

  }

  openModal();
}


function fillStudents(hid,sid){

  const h = $(hid).value;

  const selectEl = $(sid);

  if(!h){

    selectEl.innerHTML =
      '<option value="">Pilih halaqoh terlebih dahulu</option>';

    return;
  }

  const opts = cache.students.filter(
    s =>
      s.halaqoh_id === h &&
      s.aktif
  );

  selectEl.innerHTML =
    '<option value="">Pilih murid</option>' +

    opts.map(s => `
      <option value="${s.id}">
        ${esc(s.nama)} — ${esc(
          cache.classes.find(
            c => c.id === s.class_id
          )?.nama || ''
        )}
      </option>
    `).join('');
}


async function saveJournal(e,id=''){

  e.preventDefault();

  const student_id = $('js').value;

  const halaqoh_id = $('jh').value;

  const month = $('jm').value;

  const hafalan = $('jhaf').value.trim();

  const catatan = $('jcat').value.trim();

  if(!halaqoh_id){
    return toast(
      'Silakan pilih halaqoh terlebih dahulu',
      'err'
    );
  }

  if(!student_id){
    return toast(
      'Silakan pilih nama murid terlebih dahulu',
      'err'
    );
  }

  if(!month){
    return toast(
      'Silakan pilih bulan',
      'err'
    );
  }

  if(!hafalan){
    return toast(
      'Hafalan wajib diisi',
      'err'
    );
  }

  const month_start = month + '-01';

  let result;

  if(id){

    result = await sb
      .from('monthly_journals')
      .update({
        student_id,
        month_start,
        halaqoh_id,
        teacher_id: current.id,
        hafalan,
        catatan
      })
      .eq('id',id);

  }else{

    result = await sb
      .from('monthly_journals')
      .upsert(
        {
          student_id,
          month_start,
          halaqoh_id,
          teacher_id: current.id,
          hafalan,
          catatan
        },
        {
          onConflict: 'student_id,month_start'
        }
      );

  }

  if(result.error){

    console.error(result.error);

    return toast(
      result.error.message,
      'err'
    );

  }

  toast(
    id
      ? 'Jurnal berhasil diperbarui'
      : 'Jurnal berhasil disimpan'
  );

  closeModal();

  await loadAll();

  go('journal');
}


async function deleteJournal(id){

  const record =
    cache.journals.find(x => x.id === id);

  if(!record){
    return toast(
      'Data jurnal tidak ditemukan',
      'err'
    );
  }

  const student =
    cache.students.find(
      x => x.id === record.student_id
    );

  if(!confirm(
    `Hapus jurnal ${student?.nama || 'murid ini'} bulan ${record.month_start}?`
  )){
    return;
  }

  const {error} = await sb
    .from('monthly_journals')
    .delete()
    .eq('id',id);

  if(error){

    console.error(error);

    return toast(
      error.message,
      'err'
    );

  }

  toast('Jurnal berhasil dihapus');

  await loadAll();

  go('journal');
}
function report(){

  const rows = cache.reports.filter(
    r => current.role === 'koordinator' || r.teacher_id === current.id
  );

  return `
    <div class="bg-white rounded-2xl p-5 shadow-sm">

      <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">

        <div>
          <b class="text-lg">Rekap 3 Bulan</b>

          <p class="text-xs text-slate-500">
            Guru hanya dapat mengelola laporan dari penugasannya.
          </p>
        </div>

        <button
          onclick="openReport()"
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg">
          + Isi Rekap
        </button>

      </div>

      <div class="overflow-x-auto">

        <table class="w-full text-sm">

          <thead>

            <tr class="bg-slate-50">

              <th class="p-3 text-left">Periode</th>
              <th class="p-3 text-left">Murid</th>
              <th class="p-3 text-left">Kelas</th>
              <th class="p-3 text-left">Bulan 1</th>
              <th class="p-3 text-left">Bulan 2</th>
              <th class="p-3 text-left">Bulan 3</th>
              <th class="p-3 text-left">Persentase</th>
              <th class="p-3 text-left">Catatan</th>
              <th class="p-3 text-left">Aksi</th>

            </tr>

          </thead>

          <tbody>

            ${
              rows.length
              ?
              rows.map(r => {

                const s = cache.students.find(
                  x => x.id === r.student_id
                );

                const c = cache.classes.find(
                  x => x.id === r.class_id
                );

                const j1 = cache.journals.find(
                  x => x.id === r.month1_journal_id
                );

                const j2 = cache.journals.find(
                  x => x.id === r.month2_journal_id
                );

                const j3 = cache.journals.find(
                  x => x.id === r.month3_journal_id
                );

                return `
                  <tr class="border-t hover:bg-slate-50">

                    <td class="p-3">
                      ${esc(r.period_start || '-')}
                    </td>

                    <td class="p-3">
                      ${esc(s?.nama || '-')}
                    </td>

                    <td class="p-3">
                      ${esc(c?.nama || '-')}
                    </td>

                    <td class="p-3">
                      ${esc(j1?.hafalan || '-')}
                    </td>

                    <td class="p-3">
                      ${esc(j2?.hafalan || '-')}
                    </td>

                    <td class="p-3">
                      ${esc(j3?.hafalan || '-')}
                    </td>

                    <td class="p-3">
                      ${r.persentase ?? 0}%
                    </td>

                    <td class="p-3">
                      ${esc(r.catatan || '-')}
                    </td>

                    <td class="p-3 whitespace-nowrap">

                      <button
                        onclick="openReport('${r.id}')"
                        class="text-blue-600 hover:underline mr-3">
                        ✏️ Edit
                      </button>

                      <button
                        onclick="deleteReport('${r.id}')"
                        class="text-red-600 hover:underline">
                        🗑️ Hapus
                      </button>

                    </td>

                  </tr>
                `;

              }).join('')

              :

              `
                <tr>

                  <td
                    colspan="9"
                    class="p-6 text-center text-slate-500">
                    Belum ada rekap 3 bulan.
                  </td>

                </tr>
              `
            }

          </tbody>

        </table>

      </div>

    </div>
  `;
}


function openReport(id=''){

  const record = id
    ? cache.reports.find(x => x.id === id)
    : null;

  if(id && !record){
    return toast(
      'Data laporan tidak ditemukan',
      'err'
    );
  }

  const classes =
    current.role === 'koordinator'
      ? cache.classes
      : cache.teacherClass
          .filter(x => x.teacher_id === current.id)
          .map(x =>
            cache.classes.find(c => c.id === x.class_id)
          )
          .filter(Boolean);

  $('modalBox').innerHTML = `

    <h3 class="font-bold text-lg mb-4">

      ${record
        ? 'Edit Rekap 3 Bulan'
        : 'Rekap 3 Bulan'}

    </h3>

    <form
      onsubmit="saveReport(event,'${id}')"
      class="space-y-4">

      ${select(
        'rc',
        'Kelas',
        classes,
        'Pilih kelas'
      )}

      ${select(
        'rs',
        'Nama Murid',
        [],
        'Pilih kelas terlebih dahulu'
      )}

      <label class="block text-sm font-medium">

        Tanggal Periode

        <input
          id="rp"
          type="date"
          required
          class="mt-1 w-full p-2.5 border rounded-lg">

      </label>


      <div class="grid md:grid-cols-3 gap-3">

        <select
          id="rm1"
          class="w-full p-2.5 border rounded-lg">

          <option value="">
            Jurnal bulan 1
          </option>

        </select>


        <select
          id="rm2"
          class="w-full p-2.5 border rounded-lg">

          <option value="">
            Jurnal bulan 2
          </option>

        </select>


        <select
          id="rm3"
          class="w-full p-2.5 border rounded-lg">

          <option value="">
            Jurnal bulan 3
          </option>

        </select>

      </div>


      <input
        id="rper"
        type="number"
        min="0"
        max="100"
        step="0.01"
        placeholder="Persentase"
        class="w-full p-2.5 border rounded-lg">


      <textarea
        id="rcat"
        placeholder="Catatan"
        class="w-full p-2.5 border rounded-lg"></textarea>


      <div class="flex justify-end gap-2 pt-2">

        <button
          type="button"
          onclick="closeModal()"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg">

          Batal

        </button>


        <button
          type="submit"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">

          ${record
            ? 'Simpan Perubahan'
            : 'Simpan'}

        </button>

      </div>

    </form>
  `;


  $('rc').onchange = () => {

    const classId = $('rc').value;

    if(!classId){

      $('rs').innerHTML =
        '<option value="">Pilih kelas terlebih dahulu</option>';

      ['rm1','rm2','rm3'].forEach(id => {

        $(id).innerHTML =
          '<option value="">Pilih jurnal</option>';

      });

      return;
    }


    const students = cache.students.filter(
      s =>
        s.class_id === classId &&
        s.aktif
    );


    $('rs').innerHTML =
      '<option value="">Pilih murid</option>' +

      students.map(s => `
        <option value="${s.id}">
          ${esc(s.nama)}
        </option>
      `).join('');


    ['rm1','rm2','rm3'].forEach(id => {

      $(id).innerHTML =
        '<option value="">Pilih jurnal</option>';

    });

  };


  $('rs').onchange = fillReportJournals;


  if(record){

    $('rc').value =
      record.class_id || '';

    $('rc').dispatchEvent(
      new Event('change')
    );


    $('rs').value =
      record.student_id || '';

    fillReportJournals();


    $('rm1').value =
      record.month1_journal_id || '';

    $('rm2').value =
      record.month2_journal_id || '';

    $('rm3').value =
      record.month3_journal_id || '';


    $('rp').value =
      record.period_start || '';


    $('rper').value =
      record.persentase ?? '';


    $('rcat').value =
      record.catatan || '';

  }


  openModal();
}


function fillReportJournals(){

  const studentId =
    $('rs').value;


  if(!studentId){

    ['rm1','rm2','rm3'].forEach(id => {

      $(id).innerHTML =
        '<option value="">Pilih murid terlebih dahulu</option>';

    });

    return;
  }


  const journals =
    cache.journals

      .filter(
        j =>
          j.student_id === studentId
      )

      .sort(
        (a,b) =>
          String(a.month_start)
            .localeCompare(
              String(b.month_start)
            )
      );


  const options =
    '<option value="">Pilih jurnal</option>' +

    journals.map(j => `

      <option value="${j.id}">

        ${esc(j.month_start)}
        —
        ${esc(j.hafalan || '')}

      </option>

    `).join('');


  $('rm1').innerHTML = options;
  $('rm2').innerHTML = options;
  $('rm3').innerHTML = options;
}


async function saveReport(e,id=''){

  e.preventDefault();


  const student_id =
    $('rs').value;

  const class_id =
    $('rc').value;

  const period_start =
    $('rp').value;


  if(!class_id){

    return toast(
      'Silakan pilih kelas terlebih dahulu',
      'err'
    );

  }


  if(!student_id){

    return toast(
      'Silakan pilih nama murid terlebih dahulu',
      'err'
    );

  }


  if(!period_start){

    return toast(
      'Silakan pilih tanggal periode',
      'err'
    );

  }


  const payload = {

    student_id,

    class_id,

    teacher_id:
      current.id,

    period_start,

    month1_journal_id:
      $('rm1').value || null,

    month2_journal_id:
      $('rm2').value || null,

    month3_journal_id:
      $('rm3').value || null,

    persentase:
      Number(
        $('rper').value || 0
      ),

    catatan:
      $('rcat').value.trim()

  };


  let result;


  if(id){

    result =
      await sb
        .from('quarterly_reports')
        .update(payload)
        .eq('id',id);

  }else{

    result =
      await sb
        .from('quarterly_reports')
        .insert(payload);

  }


  if(result.error){

    console.error(result.error);

    return toast(
      result.error.message,
      'err'
    );

  }


  toast(
    id
      ? 'Rekap berhasil diperbarui'
      : 'Rekap berhasil disimpan'
  );


  closeModal();

  await loadAll();

  go('report');
}


async function deleteReport(id){

  const record =
    cache.reports.find(
      x => x.id === id
    );


  if(!record){

    return toast(
      'Data laporan tidak ditemukan',
      'err'
    );

  }


  const student =
    cache.students.find(
      x => x.id === record.student_id
    );


  if(!confirm(
    `Hapus rekap 3 bulan ${student?.nama || 'murid ini'} periode ${record.period_start}?`
  )){

    return;

  }


  const {error} =
    await sb
      .from('quarterly_reports')
      .delete()
      .eq('id',id);


  if(error){

    console.error(error);

    return toast(
      error.message,
      'err'
    );

  }


  toast(
    'Rekap 3 bulan berhasil dihapus'
  );


  await loadAll();

  go('report');
}
function exam(){

  const rows = cache.exams.filter(
    x => current.role === 'koordinator' || x.teacher_id === current.id
  );

  return `
    <div class="bg-white rounded-2xl p-5 shadow-sm">

      <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">

        <div>
          <b class="text-lg">Ujian Kenaikan Juz</b>

          <p class="text-xs text-slate-500">
            Pengajuan, verifikasi, dan hasil ujian kenaikan juz.
          </p>
        </div>

        <button
          onclick="openExam()"
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg">
          + Pengajuan
        </button>

      </div>

      <div class="overflow-x-auto">

        <table class="w-full text-sm">

          <thead>
            <tr class="bg-slate-50">

              <th class="p-3 text-left">Murid</th>
              <th class="p-3 text-left">Halaqoh</th>
              <th class="p-3 text-left">Juz</th>
              <th class="p-3 text-left">Tanggal</th>
              <th class="p-3 text-left">Status</th>
              <th class="p-3 text-left">Predikat</th>
              <th class="p-3 text-left">Aksi</th>

            </tr>
          </thead>

          <tbody>

            ${
              rows.length
              ?
              rows.map(x => {

                const s = cache.students.find(
                  a => a.id === x.student_id
                );

                const h = cache.halaqoh.find(
                  a => a.id === x.halaqoh_id
                );

                return `
                  <tr class="border-t hover:bg-slate-50">

                    <td class="p-3">
                      ${esc(s?.nama || '-')}
                    </td>

                    <td class="p-3">
                      ${esc(h?.nama || '-')}
                    </td>

                    <td class="p-3">
                      ${esc(x.juz || '-')}
                    </td>

                    <td class="p-3">
                      ${esc(x.tanggal || '-')}
                    </td>

                    <td class="p-3">

                      ${
                        x.status === 'Lulus'
                        ? '<span class="text-emerald-600 font-medium">Lulus</span>'

                        : x.status === 'Tidak Lulus'
                        ? '<span class="text-red-600 font-medium">Tidak Lulus</span>'

                        : '<span class="text-amber-600 font-medium">Menunggu Verifikasi</span>'
                      }

                    </td>

                    <td class="p-3">
                      ${esc(x.predikat || '-')}
                    </td>

                    <td class="p-3 whitespace-nowrap">

                      ${
                        current.role === 'koordinator'
                        ?
                        `
                          <button
                            onclick="verifyExam('${x.id}')"
                            class="text-emerald-700 hover:underline mr-3">
                            ✏️ ${x.status === 'Menunggu Verifikasi' ? 'Verifikasi' : 'Edit Hasil'}
                          </button>
                        `
                        :
                        ''
                      }

                      <button
                        onclick="openExam('${x.id}')"
                        class="text-blue-600 hover:underline mr-3">
                        ✏️ Edit
                      </button>

                      <button
                        onclick="deleteExam('${x.id}')"
                        class="text-red-600 hover:underline">
                        🗑️ Hapus
                      </button>

                    </td>

                  </tr>
                `;

              }).join('')

              :

              `
                <tr>
                  <td
                    colspan="7"
                    class="p-6 text-center text-slate-500">
                    Belum ada pengajuan ujian.
                  </td>
                </tr>
              `
            }

          </tbody>

        </table>

      </div>

    </div>
  `;
}


function openExam(id=''){

  const record = id
    ? cache.exams.find(x => x.id === id)
    : null;

  if(id && !record){
    return toast(
      'Data ujian tidak ditemukan',
      'err'
    );
  }

  const students =
    cache.students.filter(
      s => s.aktif
    );

  const halaqoh =
    current.role === 'koordinator'
    ?
    cache.halaqoh
    :
    cache.teacherHalaqoh
      .filter(
        x => x.teacher_id === current.id
      )
      .map(
        x => cache.halaqoh.find(
          h => h.id === x.halaqoh_id
        )
      )
      .filter(Boolean);


  $('modalBox').innerHTML = `

    <h3 class="font-bold text-lg mb-4">

      ${record
        ? 'Edit Pengajuan Ujian'
        : 'Pengajuan Ujian'}

    </h3>


    <form
      onsubmit="saveExam(event,'${id}')"
      class="space-y-4">


      ${select(
        'es',
        'Nama Murid',
        students,
        'Pilih murid'
      )}


      ${select(
        'eh',
        'Halaqoh',
        halaqoh,
        'Pilih halaqoh'
      )}


      <input
        id="ej"
        required
        placeholder="Juz 30"
        class="w-full p-2.5 border rounded-lg">


      <input
        id="ed"
        type="date"
        required
        class="w-full p-2.5 border rounded-lg">


      <div class="flex justify-end gap-2 pt-2">

        <button
          type="button"
          onclick="closeModal()"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg">

          Batal

        </button>


        <button
          type="submit"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">

          ${record
            ? 'Simpan Perubahan'
            : 'Ajukan'}

        </button>

      </div>

    </form>
  `;


  if(record){

    $('es').value =
      record.student_id || '';

    $('eh').value =
      record.halaqoh_id || '';

    $('ej').value =
      record.juz || '';

    $('ed').value =
      record.tanggal || '';

  }


  openModal();
}


async function saveExam(e,id=''){

  e.preventDefault();


  const student_id =
    $('es').value;

  const halaqoh_id =
    $('eh').value;

  const juz =
    $('ej').value.trim();

  const tanggal =
    $('ed').value;


  if(!student_id){
    return toast(
      'Silakan pilih murid',
      'err'
    );
  }


  if(!halaqoh_id){
    return toast(
      'Silakan pilih halaqoh',
      'err'
    );
  }


  if(!juz){
    return toast(
      'Juz wajib diisi',
      'err'
    );
  }


  if(!tanggal){
    return toast(
      'Tanggal ujian wajib diisi',
      'err'
    );
  }


  const payload = {

    student_id,

    teacher_id:
      current.id,

    halaqoh_id,

    juz,

    tanggal

  };


  let result;


  if(id){

    result =
      await sb
        .from('exam_requests')
        .update(payload)
        .eq('id',id);

  }else{

    result =
      await sb
        .from('exam_requests')
        .insert({

          ...payload,

          status:
            'Menunggu Verifikasi'

        });

  }


  if(result.error){

    console.error(result.error);

    return toast(
      result.error.message,
      'err'
    );

  }


  toast(
    id
      ? 'Pengajuan ujian berhasil diperbarui'
      : 'Pengajuan ujian berhasil disimpan'
  );


  closeModal();

  await loadAll();

  go('exam');
}


function verifyExam(id){

  const x =
    cache.exams.find(
      a => a.id === id
    );


  if(!x){
    return toast(
      'Data ujian tidak ditemukan',
      'err'
    );
  }


  const opts =
    cache.examiners
      .map(e => `
        <option value="${e.id}">
          ${esc(e.nama)}
        </option>
      `)
      .join('');


  $('modalBox').innerHTML = `

    <h3 class="font-bold text-lg mb-4">
      Verifikasi / Edit Hasil Ujian
    </h3>


    <form
      onsubmit="saveVerify(event,'${id}')"
      class="space-y-4">


      <label class="block text-sm font-medium">

        Status Ujian

        <select
          id="vs"
          class="mt-1 w-full p-2.5 border rounded-lg">

          <option value="Lulus">
            Lulus
          </option>

          <option value="Tidak Lulus">
            Tidak Lulus
          </option>

        </select>

      </label>


      <label class="block text-sm font-medium">

        Penguji

        <select
          id="ve"
          required
          class="mt-1 w-full p-2.5 border rounded-lg">

          <option value="">
            Pilih penguji
          </option>

          ${opts}

        </select>

      </label>


      <label class="block text-sm font-medium">

        Predikat

        <select
          id="vp"
          class="mt-1 w-full p-2.5 border rounded-lg">

          <option value="">
            Pilih predikat
          </option>

          <option value="Mumtaz">
            Mumtaz
          </option>

          <option value="Jayyid Jiddan">
            Jayyid Jiddan
          </option>

          <option value="Jayyid">
            Jayyid
          </option>

        </select>

      </label>


      <div class="flex justify-end gap-2 pt-2">

        <button
          type="button"
          onclick="closeModal()"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg">

          Batal

        </button>


        <button
          type="submit"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">

          Simpan Hasil

        </button>

      </div>

    </form>
  `;


  $('vs').value =
    x.status === 'Tidak Lulus'
      ? 'Tidak Lulus'
      : 'Lulus';


  $('ve').value =
    x.examiner_id || '';


  $('vp').value =
    x.predikat || '';


  openModal();
}


async function saveVerify(e,id){

  e.preventDefault();


  const status =
    $('vs').value;

  const examiner_id =
    $('ve').value;

  const predikat =
    status === 'Lulus'
      ? $('vp').value
      : null;


  if(!examiner_id){

    return toast(
      'Silakan pilih penguji',
      'err'
    );

  }


  const payload = {

    status,

    predikat,

    examiner_id,

    verified_by:
      current.id,

    verified_at:
      new Date().toISOString()

  };


  const {error} =
    await sb
      .from('exam_requests')
      .update(payload)
      .eq('id',id);


  if(error){

    console.error(error);

    return toast(
      error.message,
      'err'
    );

  }


  toast(
    status === 'Lulus'
      ? 'Ujian dinyatakan Lulus'
      : 'Ujian dinyatakan Tidak Lulus'
  );


  closeModal();

  await loadAll();

  go('exam');
}


async function deleteExam(id){

  const record =
    cache.exams.find(
      x => x.id === id
    );


  if(!record){

    return toast(
      'Data ujian tidak ditemukan',
      'err'
    );

  }


  const student =
    cache.students.find(
      x => x.id === record.student_id
    );


  if(!confirm(
    `Hapus pengajuan ujian ${student?.nama || 'murid ini'} — Juz ${record.juz || '-'}?`
  )){

    return;

  }


  const {error} =
    await sb
      .from('exam_requests')
      .delete()
      .eq('id',id);


  if(error){

    console.error(error);

    return toast(
      error.message,
      'err'
    );

  }


  toast(
    'Pengajuan ujian berhasil dihapus'
  );


  await loadAll();

  go('exam');
}
function guru(){

  const gs = cache.profiles.filter(
    p => p.role === 'guru'
  );

  return `
    <div class="bg-white rounded-2xl p-5 shadow-sm">

      <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">

        <div>
          <b class="text-lg">Data Guru</b>

          <p class="text-xs text-slate-500">
            Kelola status, halaqoh, dan kelas penugasan guru.
          </p>
        </div>

        <span class="text-xs text-slate-500">
          Pendaftaran masuk otomatis dari formulir guru
        </span>

      </div>


      <div class="overflow-x-auto">

        <table class="w-full text-sm">

          <thead>

            <tr class="bg-slate-50">

              <th class="p-3 text-left">Nama</th>
              <th class="p-3 text-left">Email</th>
              <th class="p-3 text-left">Status</th>
              <th class="p-3 text-left">Halaqoh</th>
              <th class="p-3 text-left">Kelas</th>
              <th class="p-3 text-left">Aksi</th>

            </tr>

          </thead>


          <tbody>

            ${
              gs.length
              ?

              gs.map(g => {

                const hs =
                  cache.teacherHalaqoh
                    .filter(
                      x => x.teacher_id === g.id
                    )
                    .map(
                      x =>
                        cache.halaqoh.find(
                          h => h.id === x.halaqoh_id
                        )?.nama
                    )
                    .filter(Boolean)
                    .join(', ');


                const cs =
                  cache.teacherClass
                    .filter(
                      x => x.teacher_id === g.id
                    )
                    .map(
                      x =>
                        cache.classes.find(
                          c => c.id === x.class_id
                        )?.nama
                    )
                    .filter(Boolean)
                    .join(', ');


                return `

                  <tr class="border-t hover:bg-slate-50">

                    <td class="p-3">
                      ${esc(g.nama || '-')}
                    </td>

                    <td class="p-3">
                      ${esc(g.email || '-')}
                    </td>

                    <td class="p-3">

                      ${
                        g.status === 'approved'
                        ?
                        '<span class="text-emerald-600 font-medium">Approved</span>'

                        :

                        g.status === 'rejected'
                        ?
                        '<span class="text-red-600 font-medium">Rejected</span>'

                        :
                        '<span class="text-amber-600 font-medium">Pending</span>'
                      }

                    </td>

                    <td class="p-3">
                      ${esc(
                        hs ||
                        g.requested_halaqoh ||
                        '-'
                      )}
                    </td>

                    <td class="p-3">
                      ${esc(cs || '-')}
                    </td>

                    <td class="p-3 whitespace-nowrap">

                      <button
                        onclick="editGuru('${g.id}')"
                        class="text-blue-600 hover:underline mr-3">

                        ✏️ Edit

                      </button>

                      <button
                        onclick="deleteGuru('${g.id}')"
                        class="text-red-600 hover:underline">

                        🗑️ Hapus

                      </button>

                    </td>

                  </tr>

                `;

              }).join('')

              :

              `

                <tr>

                  <td
                    colspan="6"
                    class="p-6 text-center text-slate-500">

                    Belum ada data guru.

                  </td>

                </tr>

              `
            }

          </tbody>

        </table>

      </div>

    </div>
  `;
}


function editGuru(id){

  const g =
    cache.profiles.find(
      p => p.id === id
    );


  if(!g){

    return toast(
      'Data guru tidak ditemukan',
      'err'
    );

  }


  const hs =
    cache.halaqoh;


  const cs =
    cache.classes;


  const th =
    cache.teacherHalaqoh
      .filter(
        x => x.teacher_id === id
      )
      .map(
        x => x.halaqoh_id
      );


  const tc =
    cache.teacherClass
      .filter(
        x => x.teacher_id === id
      )
      .map(
        x => x.class_id
      );


  $('modalBox').innerHTML = `

    <h3 class="font-bold text-lg mb-4">

      Kelola Guru:
      ${esc(g.nama)}

    </h3>


    <div class="space-y-4">


      <label class="block text-sm font-medium">

        Nama Guru

        <input
          value="${esc(g.nama || '')}"
          disabled
          class="mt-1 w-full p-2.5 border rounded-lg bg-slate-50">

      </label>


      <label class="block text-sm font-medium">

        Email

        <input
          value="${esc(g.email || '')}"
          disabled
          class="mt-1 w-full p-2.5 border rounded-lg bg-slate-50">

      </label>


      <label class="block text-sm font-medium">

        Status Akun

        <select
          id="gs"
          class="mt-1 w-full p-2.5 border rounded-lg">

          <option value="pending">
            Pending
          </option>

          <option value="approved">
            Approved
          </option>

          <option value="rejected">
            Rejected
          </option>

        </select>

      </label>


      <div>

        <b class="text-sm">
          Halaqoh
        </b>

        <div
          class="grid md:grid-cols-2 gap-2 mt-2">

          ${
            hs.map(h => `

              <label
                class="p-2 bg-slate-50 rounded cursor-pointer">

                <input
                  type="checkbox"
                  class="gh"
                  value="${h.id}"
                  ${th.includes(h.id) ? 'checked' : ''}>

                ${esc(h.nama)}

              </label>

            `).join('')
          }

        </div>

      </div>


      <div>

        <b class="text-sm">
          Kelas / Partner Wali
        </b>

        <div
          class="grid md:grid-cols-2 gap-2 mt-2">

          ${
            cs.map(c => `

              <label
                class="p-2 bg-slate-50 rounded cursor-pointer">

                <input
                  type="checkbox"
                  class="gc"
                  value="${c.id}"
                  ${tc.includes(c.id) ? 'checked' : ''}>

                ${esc(c.nama)}

              </label>

            `).join('')
          }

        </div>

      </div>


      <div class="flex justify-end gap-2 pt-2">

        <button
          type="button"
          onclick="closeModal()"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg">

          Batal

        </button>


        <button
          type="button"
          onclick="saveGuru('${id}')"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">

          Simpan Perubahan

        </button>

      </div>

    </div>

  `;


  $('gs').value =
    g.status || 'pending';


  openModal();
}


async function saveGuru(id){

  const status =
    $('gs').value;


  const checkedHalaqoh =
    [
      ...document.querySelectorAll('.gh:checked')
    ]
    .map(
      x => ({
        teacher_id: id,
        halaqoh_id: x.value
      })
    );


  const checkedClass =
    [
      ...document.querySelectorAll('.gc:checked')
    ]
    .map(
      x => ({
        teacher_id: id,
        class_id: x.value
      })
    );


  // Update status guru

  const r =
    await sb
      .from('profiles')
      .update({
        status
      })
      .eq('id',id);


  if(r.error){

    console.error(r.error);

    return toast(
      r.error.message,
      'err'
    );

  }


  // Hapus penugasan lama

  const rh =
    await sb
      .from('teacher_halaqoh')
      .delete()
      .eq('teacher_id',id);


  if(rh.error){

    console.error(rh.error);

    return toast(
      rh.error.message,
      'err'
    );

  }


  const rc =
    await sb
      .from('teacher_class')
      .delete()
      .eq('teacher_id',id);


  if(rc.error){

    console.error(rc.error);

    return toast(
      rc.error.message,
      'err'
    );

  }


  // Simpan penugasan halaqoh baru

  if(checkedHalaqoh.length){

    const ih =
      await sb
        .from('teacher_halaqoh')
        .insert(
          checkedHalaqoh
        );


    if(ih.error){

      console.error(ih.error);

      return toast(
        ih.error.message,
        'err'
      );

    }

  }


  // Simpan penugasan kelas baru

  if(checkedClass.length){

    const ic =
      await sb
        .from('teacher_class')
        .insert(
          checkedClass
        );


    if(ic.error){

      console.error(ic.error);

      return toast(
        ic.error.message,
        'err'
      );

    }

  }


  toast(
    'Data guru berhasil diperbarui'
  );


  closeModal();

  await loadAll();

  go('guru');
}


async function deleteGuru(id){

  const g =
    cache.profiles.find(
      p => p.id === id
    );


  if(!g){

    return toast(
      'Data guru tidak ditemukan',
      'err'
    );

  }


  if(!confirm(
    `Hapus data guru "${g.nama || 'guru ini'}"?`
  )){

    return;

  }


  // Hapus penugasan halaqoh

  const rh =
    await sb
      .from('teacher_halaqoh')
      .delete()
      .eq('teacher_id',id);


  if(rh.error){

    console.error(rh.error);

    return toast(
      rh.error.message,
      'err'
    );

  }


  // Hapus penugasan kelas

  const rc =
    await sb
      .from('teacher_class')
      .delete()
      .eq('teacher_id',id);


  if(rc.error){

    console.error(rc.error);

    return toast(
      rc.error.message,
      'err'
    );

  }


  // Hapus profil guru

  const rp =
    await sb
      .from('profiles')
      .delete()
      .eq('id',id);


  if(rp.error){

    console.error(rp.error);

    return toast(
      rp.error.message,
      'err'
    );

  }


  toast(
    'Data guru berhasil dihapus'
  );


  await loadAll();

  go('guru');
}
function masterCards(){return `<div class="grid lg:grid-cols-3 gap-4"><div class="bg-white p-5 rounded-2xl"><h3 class="font-bold mb-3">Kelas</h3><form onsubmit="addMaster(event,'classes','mc')" class="flex gap-2"><input id="mc" required class="flex-1 border rounded-lg p-2" placeholder="Nama kelas"><button class="bg-emerald-600 text-white px-3 rounded-lg">+</button></form><ul class="mt-4 space-y-2">${cache.classes.map(x=>`<li class="flex justify-between border-b pb-2"><span>${esc(x.nama)}</span><button onclick="delMaster('classes','${x.id}')" class="text-red-600">×</button></li>`).join('')}</ul></div><div class="bg-white p-5 rounded-2xl"><h3 class="font-bold mb-3">Halaqoh</h3><form onsubmit="addMaster(event,'halaqoh','mh')" class="flex gap-2"><input id="mh" required class="flex-1 border rounded-lg p-2" placeholder="Nama halaqoh"><button class="bg-emerald-600 text-white px-3 rounded-lg">+</button></form><ul class="mt-4 space-y-2">${cache.halaqoh.map(x=>`<li class="flex justify-between border-b pb-2"><span>${esc(x.nama)}</span><button onclick="delMaster('halaqoh','${x.id}')" class="text-red-600">×</button></li>`).join('')}</ul></div><div class="bg-white p-5 rounded-2xl"><h3 class="font-bold mb-3">Penguji</h3><form onsubmit="addMaster(event,'examiners','me')" class="flex gap-2"><input id="me" required class="flex-1 border rounded-lg p-2" placeholder="Nama penguji"><button class="bg-emerald-600 text-white px-3 rounded-lg">+</button></form><ul class="mt-4 space-y-2">${cache.examiners.map(x=>`<li class="flex justify-between border-b pb-2"><span>${esc(x.nama)}</span><button onclick="delMaster('examiners','${x.id}')" class="text-red-600">×</button></li>`).join('')}</ul></div></div>`}
function settingsPage(){return `<div class="space-y-6"><div class="bg-white rounded-2xl p-6 shadow-sm"><div class="flex items-start justify-between gap-4 mb-5"><div><h3 class="font-bold text-lg">Identitas Lembaga</h3><p class="text-sm text-slate-500">Perubahan akan diterapkan pada halaman login dan header aplikasi.</p></div><span class="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">Khusus Koordinator</span></div><form onsubmit="saveSettings(event)" class="grid md:grid-cols-2 gap-4"><label class="block text-sm font-medium md:col-span-2">Nama lembaga<input id="setName" required value="${esc(settings.institution_name)}" class="mt-1 w-full p-3 border rounded-lg" placeholder="Contoh: SMP Tahfidz Al-Qur'an"></label><label class="block text-sm font-medium">Logo lembaga<input id="setLogoFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="mt-1 w-full p-2.5 border rounded-lg"><span class="text-xs text-slate-500">Pilih logo dari komputer. Maksimal 500 KB.</span></label><label class="block text-sm font-medium">Tema<select id="setTheme" class="mt-1 w-full p-3 border rounded-lg"><option value="emerald">Emerald</option><option value="blue">Biru</option><option value="purple">Ungu</option><option value="amber">Amber</option><option value="rose">Rose</option></select></label><div class="md:col-span-2 flex items-center gap-4"><div class="w-16 h-16 border rounded-xl flex items-center justify-center overflow-hidden bg-slate-50"><img id="logoPreview" class="max-w-full max-h-full object-contain ${settings.logo_url?'':'hidden'}" src="${esc(settings.logo_url||'')}" alt="Preview logo"><span id="logoPreviewEmpty" class="text-xs text-slate-400 ${settings.logo_url?'hidden':''}">Logo</span></div><div class="text-sm text-slate-500">Preview logo</div></div><button class="md:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-semibold">Simpan Identitas & Tema</button></form></div><div><div class="flex items-center justify-between mb-3"><div><h3 class="font-bold text-lg">Pengaturan Master</h3><p class="text-sm text-slate-500">Kelas, halaqoh, dan penguji yang digunakan oleh menu lainnya.</p></div></div>${masterCards()}</div></div>`}
function bindSettings(){$('setTheme').value=settings.theme||'emerald';$('setLogoFile').addEventListener('change',async()=>{const f=$('setLogoFile').files?.[0];if(!f)return;if(f.size>500*1024){toast('Ukuran logo maksimal 500 KB','err');$('setLogoFile').value='';return}const u=await fileToDataUrl(f),img=$('logoPreview');img.src=u;img.classList.remove('hidden');$('logoPreviewEmpty').classList.add('hidden')})}
function fileToDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
async function saveSettings(e){e.preventDefault();let logo_url=settings.logo_url||'';const file=$('setLogoFile')?.files?.[0];if(file){if(file.size>500*1024)return toast('Ukuran logo maksimal 500 KB','err');logo_url=await fileToDataUrl(file)}const next={id:1,institution_name:$('setName').value.trim(),logo_url,theme:$('setTheme').value,updated_by:current.id,updated_at:new Date().toISOString()};const {data,error}=await sb.from('app_settings').upsert(next,{onConflict:'id'}).select().single();if(error)return toast(error.message,'err');settings={...settings,...data};applySettings();toast('Peraturan & pengaturan tersimpan');go('settings')}
async function addMaster(e,table,input){e.preventDefault();const {error}=await sb.from(table).insert({nama:$(input).value.trim()});if(error)return toast(error.message,'err');toast('Data ditambahkan');await loadAll();go('settings')}
async function delMaster(table,id){if(!confirm('Hapus data ini?'))return;const {error}=await sb.from(table).delete().eq('id',id);if(error)return toast(error.message,'err');toast('Data dihapus');await loadAll();go('settings')}
function student(){
  return `
    <div class="bg-white rounded-2xl p-5 shadow-sm">

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <b class="text-lg">Data Murid</b>
          <p class="text-xs text-slate-500">
            Kelola data murid, kelas, halaqoh, dan status.
          </p>
        </div>

        <button
          onclick="openStudent()"
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg">
          + Tambah Murid
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50">
              <th class="p-3 text-left">Nama</th>
              <th class="p-3 text-left">NIS</th>
              <th class="p-3 text-left">Kelas</th>
              <th class="p-3 text-left">Halaqoh</th>
              <th class="p-3 text-left">Status</th>
              <th class="p-3 text-left">Aksi</th>
            </tr>
          </thead>

          <tbody>
            ${
              cache.students.length
              ?
              cache.students.map(s=>`
                <tr class="border-t hover:bg-slate-50">

                  <td class="p-3">
                    ${esc(s.nama)}
                  </td>

                  <td class="p-3">
                    ${esc(s.nis || '-')}
                  </td>

                  <td class="p-3">
                    ${esc(
                      cache.classes.find(c=>c.id===s.class_id)?.nama || '-'
                    )}
                  </td>

                  <td class="p-3">
                    ${esc(
                      cache.halaqoh.find(h=>h.id===s.halaqoh_id)?.nama || '-'
                    )}
                  </td>

                  <td class="p-3">
                    ${
                      s.aktif !== false
                      ? '<span class="text-emerald-600 font-medium">Aktif</span>'
                      : '<span class="text-slate-500">Nonaktif</span>'
                    }
                  </td>

                  <td class="p-3 whitespace-nowrap">

                    <button
                      onclick="openStudent('${s.id}')"
                      class="text-blue-600 hover:underline mr-3">
                      ✏️ Edit
                    </button>

                    <button
                      onclick="deleteStudent('${s.id}')"
                      class="text-red-600 hover:underline">
                      🗑️ Hapus
                    </button>

                  </td>

                </tr>
              `).join('')
              :
              `
                <tr>
                  <td colspan="6" class="p-6 text-center text-slate-500">
                    Belum ada data murid.
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>
      </div>

    </div>
  `;
}


function openStudent(id=''){

  const s = id
    ? cache.students.find(x=>x.id===id)
    : null;

  const cs = cache.classes;
  const hs = cache.halaqoh;

  $('modalBox').innerHTML = `

    <h3 class="font-bold text-lg mb-4">
      ${s ? 'Edit Data Murid' : 'Tambah Data Murid'}
    </h3>

    <form
      onsubmit="saveStudent(event,'${id}')"
      class="space-y-4">

      <label class="block text-sm font-medium">
        Nama Murid
        <input
          id="sn"
          required
          value="${esc(s?.nama || '')}"
          placeholder="Nama murid"
          class="mt-1 w-full p-2.5 border rounded-lg">
      </label>

      <label class="block text-sm font-medium">
        NIS
        <input
          id="snis"
          value="${esc(s?.nis || '')}"
          placeholder="NIS"
          class="mt-1 w-full p-2.5 border rounded-lg">
      </label>

      ${select('sc','Kelas',cs)}

      ${select('sh','Halaqoh',hs)}

      <label class="block text-sm font-medium">
        Status

        <select
          id="saktif"
          class="mt-1 w-full p-2.5 border rounded-lg">

          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>

        </select>
      </label>

      <div class="flex justify-end gap-2 pt-2">

        <button
          type="button"
          onclick="closeModal()"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg">
          Batal
        </button>

        <button
          type="submit"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
          Simpan
        </button>

      </div>

    </form>
  `;

  if(s){

    $('sc').value = s.class_id || '';

    $('sh').value = s.halaqoh_id || '';

    $('saktif').value =
      String(s.aktif !== false);

  }

  openModal();
}


async function saveStudent(e,id=''){

  e.preventDefault();

  const nama = $('sn').value.trim();

  if(!nama){
    return toast('Nama murid wajib diisi','err');
  }

  const payload = {
    nama,
    nis: $('snis').value.trim() || null,
    class_id: $('sc').value || null,
    halaqoh_id: $('sh').value || null,
    aktif: $('saktif').value === 'true'
  };

  let result;

  if(id){

    result = await sb
      .from('students')
      .update(payload)
      .eq('id',id);

  }else{

    result = await sb
      .from('students')
      .insert(payload);

  }

  if(result.error){
    return toast(result.error.message,'err');
  }

  toast(
    id
    ? 'Data murid berhasil diperbarui'
    : 'Murid berhasil ditambahkan'
  );

  closeModal();

  await loadAll();

  go('student');
}


async function deleteStudent(id){

  const s = cache.students.find(x=>x.id===id);

  if(!s) return;

  if(!confirm(
    `Hapus data murid "${s.nama}"?`
  )){
    return;
  }

  const {error} = await sb
    .from('students')
    .delete()
    .eq('id',id);

  if(error){
    return toast(error.message,'err');
  }

  toast('Data murid berhasil dihapus');

  await loadAll();

  go('student');
}
function bindJournal(){} function bindReport(){} function bindExam(){} function bindGuru(){} function bindStudent(){}
function openModal(){$('modal').classList.remove('hidden')} function closeModal(){$('modal').classList.add('hidden')}
async function logout(){await sb?.auth.signOut();location.reload()}
(async()=>{if(!configured){$('configWarning').classList.remove('hidden');return}sb=window.supabase.createClient(cfg.url,cfg.anonKey);const {data}=await sb.auth.getSession();if(data.session)await start(data.session.user)})();
