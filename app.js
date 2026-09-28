const cfg=window.SUPABASE_CONFIG||{}; const configured=cfg.url&&cfg.url.includes('supabase.co')&&cfg.anonKey&&cfg.anonKey!=='YOUR_SUPABASE_ANON_PUBLIC_KEY';
let sb=null,
current=null,
settings={
  institution_name:'Administrasi Tahfidz',
  logo_url:'',
  theme:'emerald',
  rapor_tanggal_terbit:''
},
cache={
  profiles:[],
  classes:[],
  halaqoh:[],
  examiners:[],
  teacherHalaqoh:[],
  teacherClass:[],
  students:[],
  journals:[],
  reports:[],
  exams:[],
  certificates:[],
  assessments:[],
  memorizations:[]
};
const $=id=>document.getElementById(id); const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const themes={emerald:{dark:'bg-emerald-900',mid:'bg-emerald-800',accent:'bg-emerald-600',hover:'hover:bg-emerald-800',light:'bg-emerald-100',text:'text-emerald-700'},blue:{dark:'bg-blue-900',mid:'bg-blue-800',accent:'bg-blue-600',hover:'hover:bg-blue-800',light:'bg-blue-100',text:'text-blue-700'},purple:{dark:'bg-purple-900',mid:'bg-purple-800',accent:'bg-purple-600',hover:'hover:bg-purple-800',light:'bg-purple-100',text:'text-purple-700'},amber:{dark:'bg-amber-900',mid:'bg-amber-800',accent:'bg-amber-600',hover:'hover:bg-amber-800',light:'bg-amber-100',text:'text-amber-700'},rose:{dark:'bg-rose-900',mid:'bg-rose-800',accent:'bg-rose-600',hover:'hover:bg-rose-800',light:'bg-rose-100',text:'text-rose-700'}};
function toast(msg,type='ok'){const t=$('toast');t.textContent=msg;t.className=`fixed top-4 right-4 z-[100] max-w-sm rounded-xl px-4 py-3 text-sm shadow-lg ${type==='err'?'bg-red-600 text-white':'bg-emerald-600 text-white'}`;setTimeout(()=>t.classList.add('hidden'),3000)}
function showAuth(x){$('loginForm').classList.toggle('hidden',x!=='login');$('registerForm').classList.toggle('hidden',x!=='register');$('tabLogin').className=x==='login'?'flex-1 py-2 rounded-lg bg-emerald-600 text-white':'flex-1 py-2 rounded-lg bg-slate-100';$('tabRegister').className=x==='register'?'flex-1 py-2 rounded-lg bg-emerald-600 text-white':'flex-1 py-2 rounded-lg bg-slate-100'}
async function registerTeacher(e){
  e.preventDefault();

  if(!configured){
    return toast(
      'Konfigurasi Supabase belum diisi',
      'err'
    );
  }

  const nama =
    $('regName').value.trim();

  const nipy =
    $('regNipy').value.trim();

  const email =
    $('regEmail').value.trim();

  const password =
    $('regPassword').value;

  const halaqoh =
    $('regHalaqoh').value.trim();

  if(!nama){
    return toast(
      'Nama guru wajib diisi',
      'err'
    );
  }

  if(!nipy){
    return toast(
      'NIPY guru wajib diisi',
      'err'
    );
  }

  if(!email){
    return toast(
      'Email wajib diisi',
      'err'
    );
  }

  if(!password){
    return toast(
      'Password wajib diisi',
      'err'
    );
  }

  if(!halaqoh){
    return toast(
      'Halaqoh wajib diisi',
      'err'
    );
  }

  const { error } =
    await sb.auth.signUp({
      email,
      password,
      options:{
        data:{
          nama: nama,
          nipy: nipy,
          halaqoh: halaqoh
        }
      }
    });

  if(error){
    console.error(error);

    return toast(
      error.message,
      'err'
    );
  }

  toast(
    'Pendaftaran terkirim. Tunggu persetujuan Koordinator.'
  );

  e.target.reset();

  showAuth('login');
}
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
  exams: 'exam_requests',
  certificates: 'certificate_requests',

  // RAPOR TAHFIDZ
  assessments: 'tahfidz_assessments',
  memorizations: 'tahfidz_memorizations'
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
function buildNav(){
  const isC = current.role === 'koordinator';

  $('nav').innerHTML = `
    <button onclick="go('home')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">
      🏠 Beranda
    </button>

    <button onclick="go('journal')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">
      📖 Jurnal Tahfidz Bulanan
    </button>

    <button onclick="go('report')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">
      📊 Rekap 3 Bulan
    </button>

<button onclick="go('exam')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">
  🏅 Ujian Kenaikan Juz
</button>

<button onclick="go('certificate')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">
  📜 Sertifikat Kenaikan Juz
</button>
<button
  onclick="go('rapor')"
  class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">

  📑 Rapor Tahfidz

</button>

${isC ? `
      <button onclick="go('guru')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">
        👨‍🏫 Data Guru & Persetujuan
      </button>

      <button onclick="go('settings')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">
        ⚙️ Peraturan & Pengaturan
      </button>
    ` : ''}

    <button onclick="go('student')" class="nav w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-800">
      👦 Data Murid
    </button>
  `;
}
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
  certificate: ['Sertifikat Kenaikan Juz', 'Pengajuan dan penerbitan sertifikat'],
    rapor: [
  'Rapor Tahfidz',
  'Penilaian semester dan detail hafalan per surat'
],
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
  certificate: certificate,
  rapor: rapor,
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
  if (page === 'rapor') bindRapor();

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
function home(){

  const pending =
    cache.profiles.filter(
      p => p.status === 'pending'
    ).length;

  const jr =
    cache.journals.length;

  const rp =
    cache.reports.length;


  const studentCount =
    cache.students.filter(
      s => s.aktif !== false
    ).length;

  const institutionName =
    settings.institution_name ||
    'Administrasi Tahfidz';

  const logo =
    settings.logo_url || '';
    const background =
  settings.background_url || '';

  return `

    <!-- HERO -->
<div
  class="relative overflow-hidden rounded-3xl
         min-h-[360px] md:min-h-[400px]
         shadow-xl
         ${background
           ? ''
           : 'bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700'
         }"
  style="${
    background
      ? `
        background-image:
          linear-gradient(
            rgba(2,44,34,0.68),
            rgba(6,78,59,0.78)
          ),
          url('${esc(background)}');
        background-size: cover;
        background-position: center;
      `
      : ''
  }">

      <!-- Dekorasi -->
      <div
        class="absolute -top-24 -right-24
               w-72 h-72 rounded-full
               bg-emerald-400/20 blur-2xl">
      </div>

      <div
        class="absolute -bottom-32 -left-20
               w-80 h-80 rounded-full
               bg-teal-300/10 blur-3xl">
      </div>

      <div
        class="absolute inset-0 opacity-10"
        style="
          background-image:
          radial-gradient(circle at 20% 20%, white 1px, transparent 1px);
          background-size: 28px 28px;
        ">
      </div>

      <div
        class="relative z-10 h-full
               flex flex-col md:flex-row
               items-center justify-between
               gap-8 p-7 md:p-12">

        <!-- Kiri -->
        <div class="max-w-2xl text-white">

          <div
            class="inline-flex items-center gap-2
                   px-3 py-1.5 mb-5
                   rounded-full
                   bg-white/10
                   border border-white/20
                   text-emerald-100
                   text-xs font-semibold">

            <span>🌿</span>

            <span>
              Sistem Administrasi Tahfidz
            </span>

          </div>

          <h1
            class="text-3xl md:text-5xl
                   font-bold leading-tight">

            Selamat Datang di

            <span class="text-emerald-200">
              ${esc(institutionName)}
            </span>

          </h1>

          <p
            class="mt-4 max-w-xl
                   text-emerald-50/90
                   text-sm md:text-base
                   leading-relaxed">

            Kelola data murid, jurnal tahfidz,
            rekap perkembangan hafalan, halaqoh,
            guru, dan administrasi pembelajaran
            dalam satu sistem yang terintegrasi.

          </p>

          <div
            class="flex flex-wrap gap-3 mt-7">

            <button
              onclick="go('student')"
              class="
                px-5 py-2.5
                rounded-xl
                bg-white
                text-emerald-800
                font-semibold
                shadow-lg
                hover:bg-emerald-50
                transition">

              👨‍🎓 Data Murid

            </button>

            <button
              onclick="go('journal')"
              class="
                px-5 py-2.5
                rounded-xl
                bg-emerald-500/30
                border border-white/20
                text-white
                font-semibold
                hover:bg-emerald-500/40
                transition">

              📖 Jurnal Tahfidz

            </button>

          </div>

        </div>


        <!-- Logo -->
        <div
          class="
            shrink-0
            w-36 h-36 md:w-48 md:h-48
            rounded-full
            bg-white/95
            shadow-2xl
            border-8 border-white/20
            flex items-center justify-center
            overflow-hidden">

          ${
            logo
            ?
            `
<img
  src="${esc(logo)}"
  alt="Logo ${esc(institutionName)}"
  class="w-full h-full object-contain scale-115">
            `
            :
            `
              <div
                class="text-center text-emerald-800">

                <div class="text-5xl">
                  📖
                </div>

                <div
                  class="text-xs font-bold mt-2 px-3">

                  ${esc(institutionName)}

                </div>

              </div>
            `
          }

        </div>

      </div>

    </div>


    <!-- STATISTIK MENGAMBANG -->
    <div
      class="
        relative z-20
        -mt-10
        mx-4 md:mx-10
        grid
        grid-cols-2
        lg:grid-cols-4
        gap-3 md:gap-4">



      <!-- Murid -->
      <div
        class="
          bg-white
          rounded-2xl
          p-4 md:p-5
          shadow-xl
          border border-slate-100
          hover:-translate-y-1
          transition">

        <div
          class="flex items-center gap-3">

          <div
            class="
              w-11 h-11
              rounded-xl
              bg-blue-100
              flex items-center justify-center
              text-xl">

            👨‍🎓

          </div>

          <div>

            <div
              class="text-xs text-slate-500">

              Murid Aktif

            </div>

            <div
              class="text-2xl font-bold text-slate-800">

              ${studentCount}

            </div>

          </div>

        </div>

      </div>


      <!-- Jurnal -->
      <div
        class="
          bg-white
          rounded-2xl
          p-4 md:p-5
          shadow-xl
          border border-slate-100
          hover:-translate-y-1
          transition">

        <div
          class="flex items-center gap-3">

          <div
            class="
              w-11 h-11
              rounded-xl
              bg-amber-100
              flex items-center justify-center
              text-xl">

            📖

          </div>

          <div>

            <div
              class="text-xs text-slate-500">

              Jurnal Bulanan

            </div>

            <div
              class="text-2xl font-bold text-slate-800">

              ${jr}

            </div>

          </div>

        </div>

      </div>


      <!-- Rekap -->
      <div
        class="
          bg-white
          rounded-2xl
          p-4 md:p-5
          shadow-xl
          border border-slate-100
          hover:-translate-y-1
          transition">

        <div
          class="flex items-center gap-3">

          <div
            class="
              w-11 h-11
              rounded-xl
              bg-violet-100
              flex items-center justify-center
              text-xl">

            📊

          </div>

          <div>

            <div
              class="text-xs text-slate-500">

              Rekap 3 Bulan

            </div>

            <div
              class="text-2xl font-bold text-slate-800">

              ${rp}

            </div>

          </div>

        </div>

      </div>

    </div>


    <!-- BAGIAN BAWAH -->
    <div
      class="
        mt-8
        grid
        md:grid-cols-2
        gap-5">


      <!-- Alur -->
      <div
        class="
          bg-white
          rounded-2xl
          p-6
          shadow-sm
          border border-slate-100">

        <div
          class="flex items-center gap-3 mb-5">

          <div
            class="
              w-11 h-11
              rounded-xl
              bg-emerald-100
              flex items-center justify-center
              text-xl">

            🧭

          </div>

          <div>

            <h3
              class="font-bold text-slate-800">

              Alur Administrasi Tahfidz

            </h3>

            <p
              class="text-xs text-slate-500">

              Proses pembelajaran yang terhubung

            </p>

          </div>

        </div>


        <div class="space-y-4">

          <div class="flex gap-3">

            <div
              class="
                w-8 h-8
                rounded-full
                bg-emerald-100
                text-emerald-700
                flex items-center justify-center
                text-sm font-bold shrink-0">

              1

            </div>

            <div>

              <b class="text-sm">
                Jurnal Tahfidz
              </b>

              <p class="text-xs text-slate-500 mt-1">
                Guru pengampu mencatat perkembangan
                hafalan murid setiap bulan.
              </p>

            </div>

          </div>


          <div class="flex gap-3">

            <div
              class="
                w-8 h-8
                rounded-full
                bg-blue-100
                text-blue-700
                flex items-center justify-center
                text-sm font-bold shrink-0">

              2

            </div>

            <div>

              <b class="text-sm">
                Rekap 3 Bulan
              </b>

              <p class="text-xs text-slate-500 mt-1">
                Jurnal beberapa bulan menjadi
                dasar evaluasi perkembangan.
              </p>

            </div>

          </div>


          <div class="flex gap-3">

            <div
              class="
                w-8 h-8
                rounded-full
                bg-violet-100
                text-violet-700
                flex items-center justify-center
                text-sm font-bold shrink-0">

              3

            </div>

            <div>

              <b class="text-sm">
                Evaluasi & Ujian
              </b>

              <p class="text-xs text-slate-500 mt-1">
                Perkembangan murid menjadi bagian
                dari proses evaluasi tahfidz.
              </p>

            </div>

          </div>

        </div>

      </div>


      <!-- Aksi Cepat -->
      <div
        class="
          bg-gradient-to-br
          from-emerald-50
          to-teal-50
          rounded-2xl
          p-6
          border border-emerald-100">

        <div
          class="flex items-center gap-3 mb-5">

          <div
            class="
              w-11 h-11
              rounded-xl
              bg-white
              shadow-sm
              flex items-center justify-center
              text-xl">

            ⚡

          </div>

          <div>

            <h3
              class="font-bold text-slate-800">

              Akses Cepat

            </h3>

            <p
              class="text-xs text-slate-500">

              Menu yang sering digunakan

            </p>

          </div>

        </div>


        <div
          class="grid grid-cols-2 gap-3">

          <button
            onclick="go('student')"
            class="
              text-left
              bg-white
              rounded-xl
              p-4
              shadow-sm
              hover:shadow-md
              hover:-translate-y-0.5
              transition">

            <div class="text-xl mb-2">
              👨‍🎓
            </div>

            <b class="text-sm">
              Data Murid
            </b>

            <p class="text-xs text-slate-500 mt-1">
              Kelola data murid
            </p>

          </button>


          <button
            onclick="go('journal')"
            class="
              text-left
              bg-white
              rounded-xl
              p-4
              shadow-sm
              hover:shadow-md
              hover:-translate-y-0.5
              transition">

            <div class="text-xl mb-2">
              📖
            </div>

            <b class="text-sm">
              Jurnal
            </b>

            <p class="text-xs text-slate-500 mt-1">
              Catatan hafalan
            </p>

          </button>


          <button
            onclick="go('report')"
            class="
              text-left
              bg-white
              rounded-xl
              p-4
              shadow-sm
              hover:shadow-md
              hover:-translate-y-0.5
              transition">

            <div class="text-xl mb-2">
              📊
            </div>

            <b class="text-sm">
              Rekap 3 Bulan
            </b>

            <p class="text-xs text-slate-500 mt-1">
              Evaluasi tahfidz
            </p>

          </button>


          <button
            onclick="go('exam')"
            class="
              text-left
              bg-white
              rounded-xl
              p-4
              shadow-sm
              hover:shadow-md
              hover:-translate-y-0.5
              transition">

            <div class="text-xl mb-2">
              🏆
            </div>

            <b class="text-sm">
              Ujian Juz
            </b>

            <p class="text-xs text-slate-500 mt-1">
              Pengajuan ujian
            </p>

          </button>

        </div>

      </div>

    </div>


    ${
      current.role === 'koordinator'
      ?
      `
        <div
          class="
            mt-5
            bg-amber-50
            border border-amber-200
            rounded-2xl
            p-5
            flex items-center gap-4">

          <div
            class="
              w-11 h-11
              rounded-xl
              bg-amber-100
              flex items-center justify-center
              text-xl">

            🔔

          </div>

          <div>

            <b class="text-amber-900">
              ${pending}
              pendaftaran guru
              menunggu persetujuan
            </b>

            <p class="text-xs text-amber-700 mt-1">
              Silakan periksa menu Data Guru &
              Persetujuan.
            </p>

          </div>

        </div>
      `
      :
      ''
    }

  `;
}
/* =========================================================
   RAPOR TAHFIDZ
========================================================= */
// ============================================================
// HAK AKSES MURID UNTUK RAPOR TAHFIDZ
// Guru      : hanya murid dari kelas / halaqoh yang diampu
// Koordinator : semua murid aktif
// ============================================================

function getRaporAllowedStudents(){

  // Koordinator bebas melihat semua murid aktif
  if(current.role === 'koordinator'){
    return cache.students
      .filter(s => s.aktif !== false)
      .sort((a,b) =>
        String(a.nama || '').localeCompare(
          String(b.nama || ''),
          'id'
        )
      );
  }

  // Kelas yang diampu guru
  const classIds = cache.teacherClass
    .filter(x => x.teacher_id === current.id)
    .map(x => x.class_id);

  // Halaqoh yang diampu guru
  const halaqohIds = cache.teacherHalaqoh
    .filter(x => x.teacher_id === current.id)
    .map(x => x.halaqoh_id);

  // Hanya murid aktif yang berada di
  // kelas ATAU halaqoh yang diampu guru
  return cache.students
    .filter(s => {

      if(s.aktif === false){
        return false;
      }

      const sesuaiKelas =
        s.class_id &&
        classIds.includes(s.class_id);

      const sesuaiHalaqoh =
        s.halaqoh_id &&
        halaqohIds.includes(s.halaqoh_id);

      return sesuaiKelas || sesuaiHalaqoh;
    })
    .sort((a,b) =>
      String(a.nama || '').localeCompare(
        String(b.nama || ''),
        'id'
      )
    );
}


// ============================================================
// CEK AKSES MURID SAAT MENYIMPAN DATA RAPOR
// ============================================================

function isRaporStudentAllowed(studentId){

  if(!studentId){
    return false;
  }

  // Koordinator boleh semua murid aktif
  if(current.role === 'koordinator'){
    return cache.students.some(
      s =>
        s.id === studentId &&
        s.aktif !== false
    );
  }

  const student = cache.students.find(
    s => s.id === studentId
  );

  if(!student || student.aktif === false){
    return false;
  }

  const classIds = cache.teacherClass
    .filter(x => x.teacher_id === current.id)
    .map(x => x.class_id);

  const halaqohIds = cache.teacherHalaqoh
    .filter(x => x.teacher_id === current.id)
    .map(x => x.halaqoh_id);

  const sesuaiKelas =
    student.class_id &&
    classIds.includes(student.class_id);

  const sesuaiHalaqoh =
    student.halaqoh_id &&
    halaqohIds.includes(student.halaqoh_id);

  return sesuaiKelas || sesuaiHalaqoh;
}
function rapor(){

  const visibleStudents =
    getRaporAllowedStudents();

  const years = [
    ...new Set(
      cache.assessments
        .map(x => x.academic_year)
        .filter(Boolean)
        .concat(['2026/2027'])
    )
  ].sort().reverse();

  return `
    <div class="space-y-5">

      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">

        <div class="flex flex-col lg:flex-row lg:items-end gap-3">

          <!-- TAHUN AJARAN -->
          <label class="block text-sm font-medium flex-1">

            Tahun Ajaran

            <input
              id="raporYear"
              value="${esc(
                window.raporState?.academic_year ||
                years[0] ||
                '2026/2027'
              )}"
              class="mt-1 w-full p-2.5 border rounded-lg"
              placeholder="2026/2027"
            >

          </label>


          <!-- SEMESTER -->
          <label class="block text-sm font-medium w-full lg:w-48">

            Semester

            <select
              id="raporSemester"
              class="mt-1 w-full p-2.5 border rounded-lg"
            >

              ${['Ganjil','Genap']
                .map(x => `
                  <option
                    ${(
                      (window.raporState?.semester || 'Ganjil')
                      === x
                    ) ? 'selected' : ''}
                  >
                    ${x}
                  </option>
                `)
                .join('')}

            </select>

          </label>


          <!-- NAMA MURID -->
          <label class="block text-sm font-medium flex-[2]">

            Nama Murid

            <select
              id="raporStudent"
              class="mt-1 w-full p-2.5 border rounded-lg"
            >

              <option value="">
                Pilih murid
              </option>

              ${
                visibleStudents.length
                ?

                visibleStudents
                  .map(s => {

                    const className =
                      cache.classes.find(
                        c => c.id === s.class_id
                      )?.nama || '-';

                    const halaqohName =
                      cache.halaqoh.find(
                        h => h.id === s.halaqoh_id
                      )?.nama || '-';

                    return `
                      <option
                        value="${s.id}"
                        ${
                          window.raporState?.student_id === s.id
                          ? 'selected'
                          : ''
                        }
                      >
                        ${esc(s.nama)}
                        — ${esc(className)}
                        — ${esc(halaqohName)}
                      </option>
                    `;
                  })
                  .join('')

                :

                `
                  <option value="" disabled>
                    ${
                      current.role === 'koordinator'
                      ? 'Belum ada murid aktif'
                      : 'Tidak ada murid yang Anda ampu'
                    }
                  </option>
                `
              }

            </select>

            <span class="text-xs text-slate-500 mt-1 block">

              ${
                current.role === 'koordinator'
                ? 'Koordinator dapat memilih semua murid aktif.'
                : 'Guru hanya dapat memilih murid dari kelas atau halaqoh yang diampu.'
              }

            </span>

          </label>


          <!-- TOMBOL MUAT -->
          <button
            onclick="loadRaporData()"
            class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
          >
            🔎 Muat Rapor
          </button>

        </div>

      </div>


      <!-- WORKSPACE -->

      <div id="raporWorkspace">

        ${
          window.raporState?.student_id
          ?

          renderRaporWorkspace()

          :

          `
            <div
              class="bg-white rounded-2xl p-8 text-center
                     text-slate-500 shadow-sm
                     border border-slate-100"
            >

              Pilih tahun ajaran, semester, dan murid
              lalu klik <b>Muat Rapor</b>.

            </div>
          `
        }

      </div>

    </div>
  `;
}
function getRaporTanggalTerbit(){

  return settings?.rapor_tanggal_terbit || '';
}
function formatRaporDate(value){

  if(!value){
    return '-';
  }

  const date = new Date(`${value}T00:00:00`);

  if(Number.isNaN(date.getTime())){
    return value;
  }

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
function openRaporAssessment(){

  const st =
    window.raporState || {};

  const record =
    getCurrentRapor();

  if(!st?.student_id){
    return toast(
      'Pilih murid terlebih dahulu',
      'err'
    );
  }

  if(
    typeof isRaporStudentAllowed === 'function' &&
    !isRaporStudentAllowed(st.student_id)
  ){
    return toast(
      'Anda tidak memiliki akses ke murid ini',
      'err'
    );
  }


  const jenisUjian =
    record?.jenis_ujian || 'SAS';


  $('modalBox').innerHTML = `

    <h3 class="font-bold text-lg mb-4">

      ${
        record
          ? '✏️ Edit Penilaian Rapor Tahfidz'
          : '➕ Penilaian Rapor Tahfidz'
      }

    </h3>


    <form
      onsubmit="saveRaporAssessment(event,'${record?.id || ''}')"
      class="space-y-4"
    >


      <div class="grid md:grid-cols-2 gap-3">


        <!-- TAJWID -->

        <label class="block text-sm font-medium">

          Tajwid

          <input
            id="raTajwid"
            type="number"
            min="0"
            max="100"
            step="1"
            required
            value="${record?.tajwid ?? ''}"
            class="mt-1 w-full p-2.5 border rounded-lg"
          >

        </label>


        <!-- KELANCARAN -->

        <label class="block text-sm font-medium">

          Kelancaran

          <input
            id="raKelancaran"
            type="number"
            min="0"
            max="100"
            step="1"
            required
            value="${record?.kelancaran ?? ''}"
            class="mt-1 w-full p-2.5 border rounded-lg"
          >

        </label>


        <!-- JENIS UJIAN -->

        <label class="block text-sm font-medium">

          Jenis Ujian

          <select
            id="raJenisUjian"
            class="mt-1 w-full p-2.5 border rounded-lg"
          >

            <option
              value="SAS"
              ${jenisUjian === 'SAS' ? 'selected' : ''}
            >
              SAS
            </option>

            <option
              value="SAT"
              ${jenisUjian === 'SAT' ? 'selected' : ''}
            >
              SAT
            </option>

          </select>

        </label>


        <!-- NILAI UJIAN OTOMATIS -->

        <label class="block text-sm font-medium">

          Nilai SAS / SAT

          <input
            id="raNilaiUjian"
            type="number"
            readonly
            value="${record?.nilai_ujian ?? ''}"
            class="
              mt-1
              w-full
              p-2.5
              border
              rounded-lg
              bg-slate-100
            "
          >

          <span class="text-xs text-slate-500">

            Otomatis dari Tajwid dan Kelancaran.

          </span>

        </label>


        <!-- SIKAP -->

        <label class="block text-sm font-medium">

          Nilai Sikap

          <input
            id="raSikap"
            type="number"
            min="0"
            max="100"
            step="1"
            required
            value="${record?.sikap ?? ''}"
            class="mt-1 w-full p-2.5 border rounded-lg"
          >

        </label>


        <!-- NILAI TARGET -->

        <label class="block text-sm font-medium">

          Nilai Target

          <input
            id="raTarget"
            type="number"
            min="0"
            max="100"
            step="1"
            required
            value="${record?.nilai_target ?? ''}"
            class="mt-1 w-full p-2.5 border rounded-lg"
          >

        </label>


        <!-- NILAI HARIAN OTOMATIS -->

        <label class="block text-sm font-medium">

          Nilai Harian

          <input
            id="raNilaiHarian"
            type="number"
            readonly
            value="${record?.nilai_harian ?? ''}"
            class="
              mt-1
              w-full
              p-2.5
              border
              rounded-lg
              bg-slate-100
            "
          >

          <span class="text-xs text-slate-500">

            Otomatis dari Nilai Sikap dan Nilai Target.

          </span>

        </label>


        <!-- RATA-RATA HAFALAN -->

        <label class="block text-sm font-medium">

          Rata-rata Hafalan

          <input
            id="raRataHafalan"
            type="number"
            readonly
            value="${calcRaporHafalanAverage(getCurrentMemorizations()) ?? ''}"
            class="
              mt-1
              w-full
              p-2.5
              border
              rounded-lg
              bg-slate-100
            "
          >

          <span class="text-xs text-slate-500">

            Dihitung dari seluruh detail hafalan.

          </span>

        </label>


        <!-- NILAI AKHIR -->

        <label class="block text-sm font-medium">

          Nilai Akhir

          <input
            id="raNilaiAkhir"
            type="number"
            readonly
            value="${record?.nilai_akhir ?? ''}"
            class="
              mt-1
              w-full
              p-2.5
              border
              rounded-lg
              bg-emerald-50
              font-bold
            "
          >

          <span class="text-xs text-slate-500">

            Hasil perhitungan otomatis.

          </span>

        </label>

      </div>





      <!-- CATATAN -->

      <label class="block text-sm font-medium">

        Catatan Guru

        <textarea
          id="raCatatan"
          class="mt-1 w-full p-2.5 border rounded-lg"
          rows="3"
          placeholder="Catatan guru untuk rapor..."
        >${esc(record?.catatan || '')}</textarea>

      </label>


      <div class="flex justify-end gap-2">

        <button
          type="button"
          onclick="closeModal()"
          class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
        >
          Batal
        </button>

        <button
          type="submit"
          class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          💾 Simpan
        </button>

      </div>

    </form>

  `;


  /*
   * Hitung nilai secara realtime
   */

  function updateRaporCalculatedValues(){

    const tajwid =
      Number($('raTajwid')?.value);

    const kelancaran =
      Number($('raKelancaran')?.value);

    const sikap =
      Number($('raSikap')?.value);

    const nilaiTarget =
      Number($('raTarget')?.value);


    let nilaiSas = null;

    if(
      Number.isFinite(tajwid) &&
      Number.isFinite(kelancaran)
    ){

      nilaiSas =
        Math.ceil(
          (tajwid + kelancaran) / 2
        );

    }


    let nilaiHarian = null;

    if(
      Number.isFinite(sikap) &&
      Number.isFinite(nilaiTarget)
    ){

      nilaiHarian =
        Math.ceil(
          (sikap + nilaiTarget) / 2
        );

    }


    const rataHafalan =
      calcRaporHafalanAverage(
        getCurrentMemorizations()
      );


    let nilaiAkhir = null;

    if(
      Number.isFinite(rataHafalan) &&
      Number.isFinite(nilaiSas) &&
      Number.isFinite(nilaiHarian)
    ){

      nilaiAkhir =
        Math.ceil(
          (
            rataHafalan +
            nilaiSas +
            nilaiHarian
          ) / 3
        );

    }


    if($('raNilaiUjian')){

      $('raNilaiUjian').value =
        Number.isFinite(nilaiSas)
          ? nilaiSas
          : '';

    }


    if($('raNilaiHarian')){

      $('raNilaiHarian').value =
        Number.isFinite(nilaiHarian)
          ? nilaiHarian
          : '';

    }


    if($('raRataHafalan')){

      $('raRataHafalan').value =
        Number.isFinite(rataHafalan)
          ? rataHafalan
          : '';

    }


    if($('raNilaiAkhir')){

      $('raNilaiAkhir').value =
        Number.isFinite(nilaiAkhir)
          ? nilaiAkhir
          : '';

    }

  }


  /*
   * Realtime ketika nilai berubah
   */

  [
    'raTajwid',
    'raKelancaran',
    'raSikap',
    'raTarget'
  ].forEach(id => {

    const el = $(id);

    if(el){

      el.addEventListener(
        'input',
        updateRaporCalculatedValues
      );

    }

  });


  updateRaporCalculatedValues();


  openModal();

}


function calcRaporSasSat(tajwid, kelancaran){
  const t = Number(tajwid);
  const k = Number(kelancaran);

  if(!Number.isFinite(t) || !Number.isFinite(k)){
    return null;
  }

  return Number(((t + k) / 2).toFixed(2));
}


function getRaporMemorizationAverage(){
  const memos = getCurrentMemorizations();

  const nums = memos
    .map(m => Number(m.rata_rata))
    .filter(x => Number.isFinite(x));

  if(!nums.length) return null;

  return Number(
    (nums.reduce((a,b)=>a+b,0) / nums.length).toFixed(2)
  );
}


function ceilRapor(value){
  if(value === null || value === undefined || value === '') {
    return null;
  }

  const n = Number(value);

  if(!Number.isFinite(n)) {
    return null;
  }

  return Math.ceil(n);
}function ceilRapor(value){
  if(value === null || value === undefined || value === '') {
    return null;
  }

  const n = Number(value);

  if(!Number.isFinite(n)){
    return null;
  }

  return Math.ceil(n);
}


/*
 * SAS / SAT
 * = ceil((Tajwid + Kelancaran) / 2)
 */
function calcRaporSas(tajwid, kelancaran){

  const t = Number(tajwid);
  const k = Number(kelancaran);

  if(!Number.isFinite(t) || !Number.isFinite(k)){
    return null;
  }

  return Math.ceil((t + k) / 2);
}


/*
 * Nilai Harian
 * = ceil((Sikap + Nilai Target) / 2)
 */
function calcRaporHarian(sikap, nilaiTarget){

  const s = Number(sikap);
  const t = Number(nilaiTarget);

  if(!Number.isFinite(s) || !Number.isFinite(t)){
    return null;
  }

  return Math.ceil((s + t) / 2);
}


/*
 * Rata-rata seluruh hafalan
 */
function calcRaporHafalanAverage(memos){

  const values = (memos || [])
    .map(x => Number(x.rata_rata))
    .filter(x => Number.isFinite(x));

  if(!values.length){
    return null;
  }

  const total =
    values.reduce(
      (sum, value) => sum + value,
      0
    );

  return Math.ceil(total / values.length);
}


/*
 * Nilai Akhir
 *
 * = ceil(
 *   (Rata-rata Hafalan
 *    + SAS/SAT
 *    + Nilai Harian) / 3
 * )
 */
function calcRaporFinal({
  rata_rata_hafalan,
  nilai_sas,
  nilai_harian
}){

  const hafalan = Number(rata_rata_hafalan);
  const sas = Number(nilai_sas);
  const harian = Number(nilai_harian);

  if(
    !Number.isFinite(hafalan) ||
    !Number.isFinite(sas) ||
    !Number.isFinite(harian)
  ){
    return null;
  }

  return Math.ceil(
    (hafalan + sas + harian) / 3
  );
}


function calcRaporSas(tajwid, kelancaran){

  const t = Number(tajwid);
  const k = Number(kelancaran);

  if(!Number.isFinite(t) || !Number.isFinite(k)){
    return null;
  }

  return Math.ceil((t + k) / 2);
}


function calcRaporHarian(sikap, target){

  const s = Number(sikap);
  const t = Number(target);

  if(!Number.isFinite(s) || !Number.isFinite(t)){
    return null;
  }

  return Math.ceil((s + t) / 2);
}


function calcRaporFinal(v){

  const hafalan = Number(v.rata_rata_hafalan);
  const sas = Number(v.nilai_sas);
  const harian = Number(v.nilai_harian);

  if(
    !Number.isFinite(hafalan) ||
    !Number.isFinite(sas) ||
    !Number.isFinite(harian)
  ){
    return null;
  }

  return Math.ceil(
    (hafalan + sas + harian) / 3
  );
}
function calcRaporHafalanAverage(memos){

  const values = (memos || [])
    .map(x => Number(x.rata_rata))
    .filter(x => Number.isFinite(x));

  if(!values.length){
    return null;
  }

  const average =
    values.reduce((sum,value) => sum + value, 0)
    / values.length;

  return Math.ceil(average);
}
function previewRapor(){

  const st = window.raporState || {};

  if(!st.student_id){
    return toast(
      'Murid belum dipilih',
      'err'
    );
  }

  const student =
    cache.students.find(
      x => x.id === st.student_id
    );

  if(!student){
    return toast(
      'Data murid tidak ditemukan',
      'err'
    );
  }

 
  const assessment =
    getCurrentRapor();

  const memos =
    getCurrentMemorizations();

  const cls =
    cache.classes.find(
      x => x.id === student.class_id
    );

  const hal =
    cache.halaqoh.find(
      x => x.id === student.halaqoh_id
    );

  const rataHafalan =
    calcRaporHafalanAverage(memos);

  const nilaiSas =
    calcRaporSas(
      assessment?.tajwid,
      assessment?.kelancaran
    );

  const nilaiHarian =
    calcRaporHarian(
      assessment?.sikap,
      assessment?.nilai_target
    );

  const nilaiAkhir =
    calcRaporFinal({
      rata_rata_hafalan: rataHafalan,
      nilai_sas: nilaiSas,
      nilai_harian: nilaiHarian
    });
    const tanggalTerbit =
  getRaporTanggalTerbit(); 

renderRaporPreview({
  student,
  cls,
  hal,
  assessment,
  memos,

  rataHafalan,
  nilaiSas,
  nilaiHarian,
  nilaiAkhir,

  academic_year: st.academic_year,
  semester: st.semester,

  tanggalTerbit:
    getRaporTanggalTerbit()
});
}
function renderRaporPreview(data){

  try{

    const {
      student,
      cls,
      hal,
      assessment,
      memos,
      rataHafalan,
      nilaiSas,
      nilaiHarian,
      nilaiAkhir,
      academic_year,
      semester,
      tanggalTerbit
    } = data || {};


    /* =====================================================
       VALIDASI
    ===================================================== */

    if(!student){

      return toast(
        'Data murid tidak ditemukan',
        'err'
      );

    }


    /* =====================================================
       FORMAT NILAI
    ===================================================== */

    const fmt = value => {

      if(
        value === null ||
        value === undefined ||
        value === ''
      ){

        return '-';

      }

      const number = Number(value);

      if(!Number.isFinite(number)){

        return '-';

      }

      return Math.ceil(number);

    };


    /* =====================================================
       DATA SEKOLAH
    ===================================================== */

    const schoolName =
      settings?.institution_name ||
      'Administrasi Tahfidz';


    const schoolAddress =
      settings?.institution_address ||
      '-';


    /* =====================================================
       DATA GURU
       NIPY DIAMBIL DARI profiles.nipy
    ===================================================== */

    const profiles =
      Array.isArray(cache?.profiles)
        ? cache.profiles
        : [];


    const teacher =
      assessment?.teacher_id
        ? profiles.find(
            x =>
              x.id === assessment.teacher_id
          )
        : null;


    const teacherName =
      teacher?.nama ||
      current?.nama ||
      '-';


    const teacherNip =
      teacher?.nipy ||
      '';


    /* =====================================================
       TANGGAL RAPOR
    ===================================================== */

    const reportCity =
      settings?.report_city ||
      '';


    const reportDate =
      formatRaporDate(
        tanggalTerbit
      );


    /* =====================================================
       DATA HAFALAN
    ===================================================== */

    const safeMemos =
      Array.isArray(memos)
        ? memos
        : [];


    const rows = [];


    /*
     * Tetap 31 baris seperti format
     * rapor contoh Excel.
     */

    for(let i = 0; i < 31; i++){

      const m =
        safeMemos[i];


      rows.push(`

        <tr>

          <td class="rp-center">
            ${i + 1}
          </td>


          <td class="rp-center">

            ${
              m
                ? esc(m.juz ?? '')
                : ''
            }

          </td>


          <td>

            ${
              m
                ? esc(m.surah || '')
                : ''
            }

          </td>


          <td class="rp-center">

            ${
              m
                ? fmt(m.tajwid)
                : ''
            }

          </td>


          <td class="rp-center">

            ${
              m
                ? fmt(m.kelancaran)
                : ''
            }

          </td>


          <td class="rp-center">

            ${
              m
                ? fmt(m.rata_rata)
                : ''
            }

          </td>

        </tr>

      `);

    }


    /* =====================================================
       HTML RAPOR
    ===================================================== */

    const html = `

      <div
        id="raporPreviewOverlay"
        class="fixed inset-0 z-[90]
               bg-slate-900/70
               overflow-y-auto
               p-3 md:p-6">


        <div
          class="max-w-[850px] mx-auto">


          <!-- =================================================
               TOOLBAR
          ================================================= -->

          <div
            class="bg-white rounded-xl shadow-lg
                   p-3 mb-4
                   flex items-center
                   justify-between gap-3">

            <div>

              <div class="font-bold text-lg">
                Preview Rapor Tahfidz
              </div>


              <div
                class="text-xs text-slate-500">

                ${esc(student.nama || '-')}

                •

                ${esc(semester || '-')}

                •

                ${esc(academic_year || '-')}

              </div>

            </div>


            <div class="flex gap-2">

              <button
                type="button"
                onclick="closeRaporPreview()"
                class="px-4 py-2
                       bg-slate-200
                       hover:bg-slate-300
                       rounded-lg">

                ← Kembali

              </button>


              <button
                type="button"
                onclick="printRapor()"
                class="px-4 py-2
                       bg-slate-800
                       hover:bg-slate-900
                       text-white
                       rounded-lg">

                🖨️ Cetak

              </button>

            </div>

          </div>



          <!-- =================================================
               KERTAS RAPOR
          ================================================= -->

          <div
            id="raporPreviewPaper"
            class="bg-white shadow-xl">


            <style>

              /* =================================================
                 DASAR
              ================================================= */

              #raporPreviewPaper{

                color:#111;

                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;

              }


              /* =================================================
                 HALAMAN A4
              ================================================= */

              #raporPreviewPaper .rp-page{

                width:210mm;

                height:297mm;

                box-sizing:border-box;

                padding:
                  8mm
                  9mm
                  7mm
                  9mm;

                background:#fff;

                overflow:hidden;

              }


              /* =================================================
                 JUDUL
              ================================================= */

              #raporPreviewPaper .rp-title{

                text-align:center;

                font-size:20px;

                font-weight:700;

                margin-bottom:4mm;

                letter-spacing:.3px;

              }


              /* =================================================
                 IDENTITAS
              ================================================= */

              #raporPreviewPaper .rp-identity{

                width:100%;

                border-collapse:collapse;

                margin-bottom:4mm;

                font-size:10.5px;

              }


              #raporPreviewPaper .rp-identity td{

                padding:1.3px 2px;

                vertical-align:top;

              }


              #raporPreviewPaper .rp-label{

                width:27mm;

                font-weight:600;

                white-space:nowrap;

              }


              #raporPreviewPaper .rp-colon{

                width:4mm;

                text-align:center;

              }


              #raporPreviewPaper .rp-value{

                padding-right:7mm !important;

              }


              /* =================================================
                 TABEL UTAMA
              ================================================= */

              #raporPreviewPaper .rp-main-table{

                width:100%;

                border-collapse:collapse;

                table-layout:fixed;

                font-size:9.5px;

              }


              #raporPreviewPaper
              .rp-main-table th,
              #raporPreviewPaper
              .rp-main-table td{

                border:1px solid #222;

                padding:2px 3px;

                vertical-align:middle;

                line-height:1.15;

              }


              #raporPreviewPaper
              .rp-main-table th{

                text-align:center;

                font-weight:700;

              }


              #raporPreviewPaper
              .rp-main-table
              .rp-center{

                text-align:center;

              }


              #raporPreviewPaper
              .rp-score-label{

                font-weight:600;

              }


              #raporPreviewPaper
              .rp-score-head{

                text-align:center;

                font-weight:700;

              }


              #raporPreviewPaper
              .rp-score-number{

                text-align:center;

                font-weight:600;

              }


              #raporPreviewPaper
              .rp-subtitle{

                font-size:7px;

                font-weight:400;

                line-height:1.1;

                margin-top:1px;

              }


              /* =================================================
                 CATATAN
              ================================================= */

              #raporPreviewPaper .rp-note{

                margin-top:3mm;

                display:grid;

                grid-template-columns:
                  25mm
                  4mm
                  1fr;

                font-size:10.5px;

                line-height:1.3;

              }


              /* =================================================
                 TANDA TANGAN
                 2 KOLOM:
                 ORANG TUA | GURU + KEPALA SEKOLAH
              ================================================= */

              #raporPreviewPaper .rp-sign{

                margin-top:4mm;

                display:grid;

                grid-template-columns:
                  1fr
                  1fr;

                column-gap:35mm;

                font-size:10.5px;

                align-items:start;

              }


              #raporPreviewPaper
              .rp-sign-left{

                text-align:left;

              }


              #raporPreviewPaper
              .rp-sign-right{

                text-align:left;

              }


              /* =================================================
                 RUANG TANDA TANGAN
              ================================================= */

              #raporPreviewPaper
              .rp-sign-space{

                height:11mm;

              }


              /* =================================================
                 NAMA
              ================================================= */

              #raporPreviewPaper
              .rp-sign-name{

                display:inline-block;

                font-weight:700;

                text-decoration:underline;

              }


              /* =================================================
                 NIPY
              ================================================= */

              #raporPreviewPaper
              .rp-sign-nip{

                margin-top:1px;

              }


              /* =================================================
                 KEPALA SEKOLAH
              ================================================= */

              #raporPreviewPaper
              .rp-headmaster-sign{

                margin-top:3mm;

                text-align:left;

              }


              #raporPreviewPaper
              .rp-headmaster-title{

                font-weight:600;

                margin-top:1px;

                white-space:nowrap;

              }


              /* =================================================
                 PRINT
              ================================================= */

              @page{

                size:A4 portrait;

                margin:0;

              }


              @media print{

                html,
                body{

                  width:210mm;

                  height:297mm;

                  margin:0 !important;

                  padding:0 !important;

                  background:#fff;

                }


                body{

                  overflow:hidden !important;

                }


                #raporPreviewOverlay{

                  position:static !important;

                  width:auto !important;

                  height:auto !important;

                  padding:0 !important;

                  margin:0 !important;

                  background:#fff !important;

                  overflow:visible !important;

                }


                #raporPreviewOverlay
                > div{

                  width:auto !important;

                  max-width:none !important;

                  margin:0 !important;

                }


                #raporPreviewOverlay
                > div
                > div:first-child{

                  display:none !important;

                }


                #raporPreviewPaper{

                  width:210mm !important;

                  height:297mm !important;

                  margin:0 !important;

                  padding:0 !important;

                  box-shadow:none !important;

                  background:#fff !important;

                }


                #raporPreviewPaper
                .rp-page{

                  width:210mm !important;

                  height:297mm !important;

                  min-height:0 !important;

                  margin:0 !important;

                  box-sizing:border-box !important;

                  overflow:hidden !important;

                  page-break-after:avoid !important;

                  break-after:avoid !important;

                }


                #raporPreviewPaper
                table{

                  page-break-inside:avoid;

                  break-inside:avoid;

                }


                #raporPreviewPaper
                tr{

                  page-break-inside:avoid;

                  break-inside:avoid;

                }


                #raporPreviewPaper
                .rp-sign{

                  page-break-inside:avoid;

                  break-inside:avoid;

                }

              }

            </style>



            <!-- =================================================
                 HALAMAN
            ================================================= -->

            <div class="rp-page">


              <!-- =================================================
                   JUDUL
              ================================================= -->

              <div class="rp-title">

                RAPOR TAHFIDZ

              </div>



              <!-- =================================================
                   IDENTITAS
              ================================================= -->

              <table class="rp-identity">

                <tr>

                  <td class="rp-label">
                    Nama Murid
                  </td>

                  <td class="rp-colon">
                    :
                  </td>

                  <td class="rp-value">

                    ${esc(
                      student.nama || '-'
                    )}

                  </td>


                  <td class="rp-label">
                    Kelas
                  </td>

                  <td class="rp-colon">
                    :
                  </td>

                  <td>

                    ${esc(
                      cls?.nama || '-'
                    )}

                  </td>

                </tr>


                <tr>

                  <td class="rp-label">
                    NIS/NISN
                  </td>

                  <td class="rp-colon">
                    :
                  </td>

                  <td class="rp-value">

                    ${esc(
                      student.nis ||
                      student.nisn ||
                      '-'
                    )}

                  </td>


                  <td class="rp-label">
                    Halaqoh
                  </td>

                  <td class="rp-colon">
                    :
                  </td>

                  <td>

                    ${esc(
                      hal?.nama || '-'
                    )}

                  </td>

                </tr>


                <tr>

                  <td class="rp-label">
                    Nama Sekolah
                  </td>

                  <td class="rp-colon">
                    :
                  </td>

                  <td class="rp-value">

                    ${esc(
                      schoolName
                    )}

                  </td>


                  <td class="rp-label">
                    Semester
                  </td>

                  <td class="rp-colon">
                    :
                  </td>

                  <td>

                    ${esc(
                      semester || '-'
                    )}

                  </td>

                </tr>


                <tr>

                  <td class="rp-label">
                    Alamat Sekolah
                  </td>

                  <td class="rp-colon">
                    :
                  </td>

                  <td class="rp-value">

                    ${esc(
                      schoolAddress
                    )}

                  </td>


                  <td class="rp-label">
                    Tahun Ajaran
                  </td>

                  <td class="rp-colon">
                    :
                  </td>

                  <td>

                    ${esc(
                      academic_year || '-'
                    )}

                  </td>

                </tr>

              </table>



              <!-- =================================================
                   TABEL HAFALAN + NILAI
              ================================================= -->

              <table class="rp-main-table">


                <thead>

                  <tr>

                    <th
                      rowspan="2"
                      style="width:9mm;">

                      NO

                    </th>


                    <th
                      rowspan="2"
                      style="width:12mm;">

                      JUZ

                    </th>


                    <th
                      rowspan="2">

                      NAMA SURAT

                    </th>


                    <th
                      rowspan="2"
                      style="width:22mm;">

                      TAJWID

                      <div class="rp-subtitle">

                        (Mad, Makhraj, Ghunnah)

                      </div>

                    </th>


                    <th
                      rowspan="2"
                      style="width:25mm;">

                      KELANCARAN

                    </th>


                    <th
                      rowspan="2"
                      style="width:21mm;">

                      RATA-RATA

                    </th>

                  </tr>


                  <tr></tr>

                </thead>



                <tbody>

                  ${rows.join('')}


                  <!-- =========================================
                       NILAI UJIAN PRAKTIK
                  ========================================== -->

                  <tr>

                    <td
                      colspan="3"
                      rowspan="2"
                      class="rp-score-label">

                      Nilai Ujian Praktik

                    </td>


                    <td class="rp-score-head">

                      TAJWID

                    </td>


                    <td class="rp-score-head">

                      KELANCARAN

                    </td>


                    <td class="rp-score-head">

                      SAS/SAT

                    </td>

                  </tr>


                  <tr>

                    <td class="rp-score-number">

                      ${fmt(
                        assessment?.tajwid
                      )}

                    </td>


                    <td class="rp-score-number">

                      ${fmt(
                        assessment?.kelancaran
                      )}

                    </td>


                    <td class="rp-score-number">

                      ${fmt(
                        nilaiSas
                      )}

                    </td>

                  </tr>



                  <!-- =========================================
                       RATA-RATA HAFALAN
                  ========================================== -->

                  <tr>

                    <td
                      colspan="5"
                      class="rp-score-label">

                      Rata-rata Hafalan

                    </td>


                    <td class="rp-score-number">

                      ${fmt(
                        rataHafalan
                      )}

                    </td>

                  </tr>



                  <!-- =========================================
                       NILAI HARIAN
                  ========================================== -->

                  <tr>

                    <td
                      colspan="5"
                      class="rp-score-label">

                      Nilai Harian

                    </td>


                    <td class="rp-score-number">

                      ${fmt(
                        nilaiHarian
                      )}

                    </td>

                  </tr>



                  <!-- =========================================
                       NILAI AKHIR
                  ========================================== -->

                  <tr>

                    <td
                      colspan="5"
                      class="rp-score-label">

                      Nilai Akhir

                    </td>


                    <td class="rp-score-number">

                      ${fmt(
                        nilaiAkhir
                      )}

                    </td>

                  </tr>

                </tbody>

              </table>



              <!-- =================================================
                   CATATAN GURU
              ================================================= -->

              <div class="rp-note">

                <div>
                  Catatan Guru
                </div>

                <div>
                  :
                </div>

                <div>

                  ${esc(
                    assessment?.catatan ||
                    'Belum ada catatan guru.'
                  )}

                </div>

              </div>



              <!-- =================================================
                   TANDA TANGAN
              ================================================= -->

              <div class="rp-sign">


                <!-- =========================================
                     ORANG TUA / WALI
                ========================================== -->

                <div
                  class="rp-sign-left">

                  <div>

                    Orang Tua/Wali

                  </div>


                  <div
                    class="rp-sign-space">
                  </div>


                  <div>

                    (………………......)

                  </div>

                </div>



                <!-- =========================================
                     GURU + KEPALA SEKOLAH
                ========================================== -->

                <div
                  class="rp-sign-right">


                  <!-- =======================================
                       GURU TAHFIDZ
                  ======================================== -->

                  <div>

                    ${
                      reportCity
                        ? esc(reportCity) + ', '
                        : ''
                    }

                    ${esc(
                      reportDate
                    )}

                  </div>


                  <div>

                    Guru Tahfidz

                  </div>


                  <div
                    class="rp-sign-space">
                  </div>


                  <div
                    class="rp-sign-name">

                    ${esc(
                      teacherName
                    )}

                  </div>


                  <div
                    class="rp-sign-nip">

                    ${
                      teacherNip
                        ? 'NIPY. ' +
                          esc(teacherNip)
                        : ''
                    }

                  </div>



                  <!-- =======================================
                       KEPALA SEKOLAH
                  ======================================== -->

                  <div
                    class="rp-headmaster-sign">


                    <div>

                      Mengetahui,

                    </div>


                    <div
                      class="rp-headmaster-title">

                      Kepala SDITQ Abu Bakr Ash-Shiddiq

                    </div>


                    <div
                      class="rp-sign-space">
                    </div>


                    <div
                      class="rp-sign-name">

                      ${esc(
                        settings?.headmaster_name ||
                        '-'
                      )}

                    </div>


                    <div
                      class="rp-sign-nip">

                      ${
                        settings?.headmaster_nip
                          ? 'NIPY. ' +
                            esc(
                              settings.headmaster_nip
                            )
                          : ''
                      }

                    </div>

                  </div>

                </div>

              </div>


            </div>

          </div>

        </div>

      </div>

    `;


    /* =====================================================
       TAMPILKAN
    ===================================================== */

    const content =
      $('content');


    if(!content){

      return toast(
        'Area aplikasi tidak ditemukan',
        'err'
      );

    }


    content.innerHTML =
      html;


  }catch(error){

    console.error(
      'ERROR renderRaporPreview:',
      error
    );


    toast(
      'Preview rapor gagal ditampilkan. Cek Console browser.',
      'err'
    );

  }

}
function closeRaporPreview(){

  const st =
    window.raporState || {};

  if(st.student_id){

    go('rapor');

  }else{

    closeModal();

  }

}

function refreshRaporCalculatedFields(){
  const tajwid = $('raTajwid')?.value;
  const kelancaran = $('raKelancaran')?.value;
  const sikap = $('raSikap')?.value;
  const nilaiTarget = $('raNilaiTarget')?.value;

  const jenisUjian = $('raJenisUjian')?.value || 'SAS';

  const sasSat = calcRaporSasSat(
    tajwid,
    kelancaran
  );

  const rataHafalan = getRaporMemorizationAverage();

  const nilaiAkhir = calcRaporFinal({
    rata_rata_hafalan: rataHafalan,
    nilai_ujian: sasSat,
    sikap: sikap,
    nilai_target: nilaiTarget
  });

  if($('raJenisUjianLabel')){
    $('raJenisUjianLabel').textContent = jenisUjian;
  }

  if($('raUjian')){
    $('raUjian').value = sasSat ?? '';
  }

  if($('raRataHafalan')){
    $('raRataHafalan').value = rataHafalan ?? '';
  }

  if($('raNilaiAkhir')){
    $('raNilaiAkhir').value = nilaiAkhir ?? '';
  }
}


async function saveRaporAssessment(e,id=''){

  e.preventDefault();

  const st =
    window.raporState || {};

  if(!st.student_id){
    return toast(
      'Murid belum dipilih',
      'err'
    );
  }

  if(
    typeof isRaporStudentAllowed === 'function' &&
    !isRaporStudentAllowed(st.student_id)
  ){
    return toast(
      'Anda tidak memiliki akses ke murid ini',
      'err'
    );
  }


  const tajwid =
    Number($('raTajwid').value);

  const kelancaran =
    Number($('raKelancaran').value);

  const sikap =
    Number($('raSikap').value);

  const nilaiTarget =
    Number($('raTarget').value);
const jenisUjian =
  $('raJenisUjian').value;

  if(
    !Number.isFinite(tajwid) ||
    !Number.isFinite(kelancaran) ||
    !Number.isFinite(sikap) ||
    !Number.isFinite(nilaiTarget)
  ){
    return toast(
      'Tajwid, Kelancaran, Sikap, dan Nilai Target wajib diisi',
      'err'
    );
  }


  /*
   * SAS / SAT
   */
  const nilaiSas =
    calcRaporSas(
      tajwid,
      kelancaran
    );


  /*
   * Nilai Harian
   */
  const nilaiHarian =
    calcRaporHarian(
      sikap,
      nilaiTarget
    );


  /*
   * Rata-rata hafalan
   */
  const memos =
    getCurrentMemorizations();

  const rataHafalan =
    calcRaporHafalanAverage(
      memos
    );


  /*
   * Nilai Akhir
   */
  const nilaiAkhir =
    calcRaporFinal({
      rata_rata_hafalan: rataHafalan,
      nilai_sas: nilaiSas,
      nilai_harian: nilaiHarian
    });


  const payload = {

    student_id:
      st.student_id,

    academic_year:
      st.academic_year,

    semester:
      st.semester,

    tajwid,

    kelancaran,

    /*
     * Disimpan ke field lama
     * sebagai SAS/SAT hasil kalkulasi.
     */
    nilai_ujian:
      nilaiSas,

    /*
     * Disimpan sebagai hasil kalkulasi,
     * bukan input manual.
     */
    nilai_harian:
      nilaiHarian,

    nilai_target:
      nilaiTarget,

    /*
     * Tidak digunakan lagi.
     */
    target_hafalan:
      null,

    sikap,

    point:
      null,

    nilai_akhir:
      nilaiAkhir,

    jenis_ujian: jenisUjian,



    catatan:
      $('raCatatan').value.trim() || null,

    teacher_id:
      current.id,

    updated_at:
      new Date().toISOString()
  };


  let result;


  if(id){

    result =
      await sb
        .from('tahfidz_assessments')
        .update(payload)
        .eq('id',id)
        .select()
        .single();

  }else{

    result =
      await sb
        .from('tahfidz_assessments')
        .upsert(
          payload,
          {
            onConflict:
              'student_id,academic_year,semester'
          }
        )
        .select()
        .single();

  }


  if(result.error){

    console.error(
      result.error
    );

    return toast(
      result.error.message,
      'err'
    );
  }


  toast(
    'Penilaian rapor berhasil disimpan'
  );

  closeModal();

  await loadAll();

  go('rapor');
}
function openRaporMemorization(id=''){
  const st = window.raporState;
  const record = id ? cache.memorizations.find(x => x.id === id) : null;

  if(!st?.student_id){
    return toast('Murid belum dipilih','err');
  }

  if(id && !record){
    return toast('Data hafalan tidak ditemukan','err');
  }

  $('modalBox').innerHTML = `
    <h3 class="font-bold text-lg mb-4">
      ${record ? 'Edit Detail Hafalan' : 'Tambah Detail Hafalan'}
    </h3>

    <form onsubmit="saveRaporMemorization(event,'${id}')" class="space-y-4">

      <div class="grid md:grid-cols-2 gap-3">

        <label class="block text-sm font-medium">
          Juz
          <select
            id="rmJuz"
            required
            onchange="updateRaporSurahOptions()"
            class="mt-1 w-full p-2.5 border rounded-lg"
          >
            <option value="">Pilih Juz</option>

            ${Array.from({length:30}, (_,i) => {
              const juz = i + 1;
              return `
                <option
                  value="${juz}"
                  ${String(record?.juz ?? '') === String(juz) ? 'selected' : ''}
                >
                  Juz ${juz}
                </option>
              `;
            }).join('')}
          </select>
        </label>

        <label class="block text-sm font-medium">
          Nama Surat
          <select
            id="rmSurah"
            required
            class="mt-1 w-full p-2.5 border rounded-lg"
          >
            <option value="">Pilih Surat</option>
          </select>
        </label>

        <label class="block text-sm font-medium">
          Tajwid
          <input
            id="rmTajwid"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value="${record?.tajwid ?? ''}"
            class="mt-1 w-full p-2.5 border rounded-lg"
          >
        </label>

        <label class="block text-sm font-medium">
          Kelancaran
          <input
            id="rmKelancaran"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value="${record?.kelancaran ?? ''}"
            class="mt-1 w-full p-2.5 border rounded-lg"
          >
        </label>

      </div>

      <div class="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
        <b>Rata-rata:</b>
        <span id="rmRataRata">
          ${record?.rata_rata ?? '-'}
        </span>
      </div>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          onclick="closeModal()"
          class="px-4 py-2 rounded-lg bg-slate-100"
        >
          Batal
        </button>

        <button
          type="submit"
          class="px-4 py-2 rounded-lg bg-blue-600 text-white"
        >
          Simpan
        </button>
      </div>

    </form>
  `;

  openModal();

  // Isi daftar surat sesuai Juz yang dipilih
  updateRaporSurahOptions(
    record?.surah || ''
  );

  // Update rata-rata ketika nilai berubah
  $('rmTajwid').addEventListener('input', refreshRaporMemorizationAverage);
  $('rmKelancaran').addEventListener('input', refreshRaporMemorizationAverage);

  refreshRaporMemorizationAverage();
}

const RAPOR_SURAH_LIST = [
  'Al-Fatihah',
  'Al-Baqarah',
  'Ali Imran',
  'An-Nisa',
  'Al-Maidah',
  'Al-Anam',
  'Al-Araf',
  'Al-Anfal',
  'At-Taubah',
  'Yunus',
  'Hud',
  'Yusuf',
  'Ar-Rad',
  'Ibrahim',
  'Al-Hijr',
  'An-Nahl',
  'Al-Isra',
  'Al-Kahfi',
  'Maryam',
  'Taha',
  'Al-Anbiya',
  'Al-Hajj',
  'Al-Muminun',
  'An-Nur',
  'Al-Furqan',
  'Asy-Syuara',
  'An-Naml',
  'Al-Qasas',
  'Al-Ankabut',
  'Ar-Rum',
  'Luqman',
  'As-Sajdah',
  'Al-Ahzab',
  'Saba',
  'Fatir',
  'Yasin',
  'As-Saffat',
  'Sad',
  'Az-Zumar',
  'Ghafir',
  'Fussilat',
  'Asy-Syura',
  'Az-Zukhruf',
  'Ad-Dukhan',
  'Al-Jasiyah',
  'Al-Ahqaf',
  'Muhammad',
  'Al-Fath',
  'Al-Hujurat',
  'Qaf',
  'Az-Zariyat',
  'At-Tur',
  'An-Najm',
  'Al-Qamar',
  'Ar-Rahman',
  'Al-Waqiah',
  'Al-Hadid',
  'Al-Mujadilah',
  'Al-Hasyr',
  'Al-Mumtahanah',
  'As-Saff',
  'Al-Jumah',
  'Al-Munafiqun',
  'At-Tagabun',
  'At-Talaq',
  'At-Tahrim',
  'Al-Mulk',
  'Al-Qalam',
  'Al-Haqqah',
  'Al-Maarij',
  'Nuh',
  'Al-Jinn',
  'Al-Muzzammil',
  'Al-Muddassir',
  'Al-Qiyamah',
  'Al-Insan',
  'Al-Mursalat',
  'An-Naba',
  'An-Naziat',
  'Abasa',
  'At-Takwir',
  'Al-Infitar',
  'Al-Mutaffifin',
  'Al-Insyiqaq',
  'Al-Buruj',
  'At-Tariq',
  'Al-Ala',
  'Al-Gasyiyah',
  'Al-Fajr',
  'Al-Balad',
  'Asy-Syams',
  'Al-Lail',
  'Ad-Duha',
  'Asy-Syarh',
  'At-Tin',
  'Al-Alaq',
  'Al-Qadr',
  'Al-Bayyinah',
  'Az-Zalzalah',
  'Al-Adiyat',
  'Al-Qariah',
  'At-Takasur',
  'Al-Asr',
  'Al-Humazah',
  'Al-Fil',
  'Quraisy',
  'Al-Maun',
  'Al-Kausar',
  'Al-Kafirun',
  'An-Nasr',
  'Al-Lahab',
  'Al-Ikhlas',
  'Al-Falaq',
  'An-Nas'
];
function updateRaporSurahOptions(selectedSurah = ''){
  const juz = Number($('rmJuz')?.value);
  const select = $('rmSurah');

  if(!select) return;

  if(!juz){
    select.innerHTML = `
      <option value="">Pilih Juz terlebih dahulu</option>
    `;
    return;
  }

  /*
   * Untuk sementara semua surat tersedia setelah Juz dipilih.
   * Data Juz tetap disimpan pada record hafalan.
   *
   * Ini menghindari kesalahan pemetaan surat yang terpotong
   * antar-Juz.
   */
  select.innerHTML = `
    <option value="">Pilih Surat</option>

    ${RAPOR_SURAH_LIST.map(surah => `
      <option
        value="${esc(surah)}"
        ${surah === selectedSurah ? 'selected' : ''}
      >
        ${esc(surah)}
      </option>
    `).join('')}
  `;
}
function openRaporImportExcel(){

  const st = window.raporState;

  if(!st?.student_id){
    return toast('Murid belum dipilih','err');
  }

  $('modalBox').innerHTML = `
    <h3 class="font-bold text-lg mb-2">
      📥 Import Detail Hafalan dari Excel
    </h3>

    <p class="text-sm text-slate-500 mb-4">
      Pilih file Excel yang berisi daftar hafalan murid.
      Data akan dibaca terlebih dahulu sebelum dimasukkan ke rapor.
    </p>

    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">

      <b class="text-sm">Format kolom Excel:</b>

      <div class="overflow-x-auto mt-3">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-white">
              <th class="border p-2 text-left">Juz</th>
              <th class="border p-2 text-left">Nama Surat</th>
              <th class="border p-2 text-left">Tajwid</th>
              <th class="border p-2 text-left">Kelancaran</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td class="border p-2">30</td>
              <td class="border p-2">An-Naba</td>
              <td class="border p-2">90</td>
              <td class="border p-2">88</td>
            </tr>

            <tr>
              <td class="border p-2">30</td>
              <td class="border p-2">An-Nazi'at</td>
              <td class="border p-2">92</td>
              <td class="border p-2">90</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-xs text-slate-500 mt-3">
        Rata-rata akan dihitung otomatis oleh sistem.
      </p>

    </div>

    <label class="block text-sm font-medium">
      File Excel
      <input
        id="raporExcelFile"
        type="file"
        accept=".xlsx,.xls,.csv"
        class="mt-1 w-full p-2.5 border rounded-lg bg-white"
      >
    </label>

    <div class="flex justify-end gap-2 mt-5">

      <button
        type="button"
        onclick="closeModal()"
        class="px-4 py-2 rounded-lg bg-slate-100">
        Batal
      </button>

      <button
        type="button"
        onclick="previewRaporExcel()"
        class="px-4 py-2 rounded-lg bg-blue-600 text-white">
        🔍 Preview
      </button>

    </div>
  `;

  openModal();
}
async function previewRaporExcel(){

  const fileInput = $('raporExcelFile');
  const file = fileInput?.files?.[0];

  if(!file){
    return toast('Silakan pilih file Excel terlebih dahulu','err');
  }

  const st = window.raporState;

  if(!st?.student_id){
    return toast('Murid belum dipilih','err');
  }

  const student = cache.students.find(
    x => x.id === st.student_id
  );

  if(!student){
    return toast('Data murid tidak ditemukan','err');
  }

  try{

    const buffer = await file.arrayBuffer();

    const workbook = XLSX.read(buffer,{
      type:'array'
    });

    if(!workbook.SheetNames.length){
      return toast(
        'File Excel tidak memiliki sheet',
        'err'
      );
    }

    /*
     * Simpan workbook sementara.
     * Tidak langsung mengambil sheet pertama lagi.
     */
    window.raporExcelWorkbook = workbook;

    const studentName = String(student.nama || '')
      .trim()
      .toLowerCase();

    /*
     * Cari sheet yang namanya sama / paling mirip
     * dengan nama murid yang sedang dipilih.
     */
    const matchedSheets = workbook.SheetNames.filter(sheetName => {

      const normalizedSheet =
        String(sheetName || '')
          .trim()
          .toLowerCase();

      return (
        normalizedSheet === studentName ||
        normalizedSheet.includes(studentName) ||
        studentName.includes(normalizedSheet)
      );

    });

    /*
     * Kalau hanya ada satu sheet yang cocok,
     * langsung tampilkan preview sheet tersebut.
     */
    if(matchedSheets.length === 1){

      window.raporSelectedSheet =
        matchedSheets[0];

      previewRaporSelectedSheet();

      return;
    }

    /*
     * Kalau tidak ditemukan atau ditemukan lebih dari satu,
     * tampilkan pilihan semua sheet.
     */
    renderRaporSheetSelector(
      workbook.SheetNames,
      matchedSheets
    );

  }catch(error){

    console.error(error);

    toast(
      'File Excel gagal dibaca. Pastikan file .xlsx/.xls valid.',
      'err'
    );

  }
}
function renderRaporSheetSelector(
  sheetNames,
  matchedSheets = []
){

  const st = window.raporState;

  const student = cache.students.find(
    x => x.id === st?.student_id
  );

  const studentName = student?.nama || '-';

  $('modalBox').innerHTML = `

    <h3 class="font-bold text-lg mb-2">
      📑 Pilih Sheet Hafalan
    </h3>

    <p class="text-sm text-slate-500 mb-4">
      Murid yang sedang dipilih:
      <b class="text-slate-800">
        ${esc(studentName)}
      </b>
    </p>

    ${
      matchedSheets.length
      ? `
        <div class="bg-emerald-50 border border-emerald-200
                    rounded-xl p-4 mb-4">

          <div class="font-semibold text-emerald-800">
            ✅ Sheet yang kemungkinan cocok ditemukan
          </div>

          <p class="text-xs text-emerald-700 mt-1">
            Nama sheet mirip dengan nama murid yang sedang dipilih.
          </p>

        </div>
      `
      : `
        <div class="bg-amber-50 border border-amber-200
                    rounded-xl p-4 mb-4">

          <div class="font-semibold text-amber-800">
            ⚠️ Sheet dengan nama murid tidak ditemukan
          </div>

          <p class="text-xs text-amber-700 mt-1">
            Silakan pilih sheet yang benar secara manual.
          </p>

        </div>
      `
    }

    <label class="block text-sm font-medium">

      Pilih Sheet

      <select
        id="raporSheetSelect"
        class="mt-1 w-full p-2.5 border rounded-lg">

        <option value="">
          Pilih sheet...
        </option>

        ${sheetNames.map(sheetName => `

          <option
            value="${esc(sheetName)}"
            ${
              matchedSheets.includes(sheetName)
                ? 'selected'
                : ''
            }>

            ${esc(sheetName)}

          </option>

        `).join('')}

      </select>

    </label>

    <div class="mt-3 text-xs text-slate-500">
      Total sheet dalam file:
      <b>${sheetNames.length}</b>
    </div>

    <div class="flex justify-end gap-2 mt-5">

      <button
        type="button"
        onclick="openRaporImportExcel()"
        class="px-4 py-2 rounded-lg bg-slate-100">

        ← Kembali

      </button>

      <button
        type="button"
        onclick="selectRaporSheet()"
        class="px-4 py-2 rounded-lg bg-blue-600 text-white">

        🔍 Gunakan Sheet

      </button>

    </div>

  `;

}
function selectRaporSheet(){

  const sheetName =
    $('raporSheetSelect')?.value;

  if(!sheetName){

    return toast(
      'Silakan pilih sheet terlebih dahulu',
      'err'
    );

  }

  window.raporSelectedSheet = sheetName;

  previewRaporSelectedSheet();

}
function previewRaporSelectedSheet(){

  const workbook =
    window.raporExcelWorkbook;

  const sheetName =
    window.raporSelectedSheet;

  if(!workbook){
    return toast(
      'File Excel belum dimuat',
      'err'
    );
  }

  if(!sheetName){
    return toast(
      'Sheet belum dipilih',
      'err'
    );
  }

  const sheet =
    workbook.Sheets[sheetName];

  if(!sheet){
    return toast(
      'Sheet tidak ditemukan',
      'err'
    );
  }

  const rows =
    XLSX.utils.sheet_to_json(sheet,{
      defval:'',
      raw:false
    });

  if(!rows.length){

    return toast(
      `Sheet "${sheetName}" tidak memiliki data`,
      'err'
    );

  }

  const normalized = rows
    .map((row,index) =>
      normalizeRaporExcelRow(row,index)
    )
    .filter(row => row !== null);

  if(!normalized.length){

    return toast(
      `Tidak ditemukan data hafalan yang valid pada sheet "${sheetName}"`,
      'err'
    );

  }

  /*
   * Simpan data hasil pembacaan.
   */
  window.raporImportRows = normalized;

  /*
   * Simpan nama sheet untuk informasi preview.
   */
  window.raporSelectedSheet = sheetName;

  renderRaporImportPreview(normalized);

}
function raporNormalizeHeader(value){

  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g,' ')
    .replace(/[_-]/g,' ');
}


function raporFindColumn(row,names){

  const keys = Object.keys(row);

  for(const key of keys){

    const normalizedKey =
      raporNormalizeHeader(key);

    if(
      names.some(name =>
        normalizedKey === raporNormalizeHeader(name)
      )
    ){
      return key;
    }

  }

  return null;
}


function normalizeRaporExcelRow(row,index){

  const juzKey = raporFindColumn(row,[
    'juz',
    'juz '
  ]);

  const surahKey = raporFindColumn(row,[
    'nama surat',
    'surat',
    'surah',
    'nama surah'
  ]);

  const tajwidKey = raporFindColumn(row,[
    'tajwid',
    'nilai tajwid'
  ]);

  const kelancaranKey = raporFindColumn(row,[
    'kelancaran',
    'nilai kelancaran'
  ]);

  const juzRaw = juzKey ? row[juzKey] : '';
  const surahRaw = surahKey ? row[surahKey] : '';
  const tajwidRaw = tajwidKey ? row[tajwidKey] : '';
  const kelancaranRaw = kelancaranKey
    ? row[kelancaranKey]
    : '';

  const surah = String(surahRaw || '').trim();

  if(!juzRaw && !surah){
    return null;
  }

  const juz = Number(
    String(juzRaw)
      .replace(/[^\d]/g,'')
  );

  const tajwid =
    tajwidRaw === ''
      ? null
      : Number(
          String(tajwidRaw)
            .replace(',','.')
            .replace(/[^\d.-]/g,'')
        );

  const kelancaran =
    kelancaranRaw === ''
      ? null
      : Number(
          String(kelancaranRaw)
            .replace(',','.')
            .replace(/[^\d.-]/g,'')
        );

  if(!Number.isFinite(juz) || juz < 1 || juz > 30){
    return null;
  }

  if(!surah){
    return null;
  }

  const rata_rata =
    Number.isFinite(tajwid) &&
    Number.isFinite(kelancaran)
      ? Number(
          ((tajwid + kelancaran) / 2)
            .toFixed(2)
        )
      : null;

  return {
    row_number: index + 2,
    juz,
    surah,
    tajwid: Number.isFinite(tajwid)
      ? tajwid
      : null,
    kelancaran: Number.isFinite(kelancaran)
      ? kelancaran
      : null,
    rata_rata
  };
}
function renderRaporImportPreview(rows){
const sheetName =
  window.raporSelectedSheet || '-';

const st = window.raporState;

const student =
  cache.students.find(
    x => x.id === st?.student_id
  );

const studentName =
  student?.nama || '-';
  $('modalBox').innerHTML = `

    <h3 class="font-bold text-lg mb-2">
      🔍 Preview Import Hafalan
    </h3>
<div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">

  <div class="grid md:grid-cols-2 gap-3 text-sm">

    <div>
      <span class="text-slate-500">
        Murid:
      </span>

      <b>
        ${esc(studentName)}
      </b>
    </div>

    <div>
      <span class="text-slate-500">
        Sheet:
      </span>

      <b>
        ${esc(sheetName)}
      </b>
    </div>

  </div>

</div>
    <p class="text-sm text-slate-500 mb-4">
      Ditemukan <b>${rows.length}</b> baris hafalan.
      Periksa data sebelum memasukkannya ke rapor.
    </p>

    <div class="overflow-x-auto border rounded-xl">

      <table class="w-full text-sm">

        <thead class="bg-slate-50">

          <tr>
            <th class="border p-2">No</th>
            <th class="border p-2">Juz</th>
            <th class="border p-2 text-left">Nama Surat</th>
            <th class="border p-2">Tajwid</th>
            <th class="border p-2">Kelancaran</th>
            <th class="border p-2">Rata-rata</th>
          </tr>

        </thead>

        <tbody>

          ${rows.map((row,i) => `

            <tr>

              <td class="border p-2 text-center">
                ${i + 1}
              </td>

              <td class="border p-2 text-center">
                ${row.juz}
              </td>

              <td class="border p-2">
                ${esc(row.surah)}
              </td>

              <td class="border p-2 text-center">
                ${row.tajwid ?? '-'}
              </td>

              <td class="border p-2 text-center">
                ${row.kelancaran ?? '-'}
              </td>

              <td class="border p-2 text-center font-semibold">
                ${row.rata_rata ?? '-'}
              </td>

            </tr>

          `).join('')}

        </tbody>

      </table>

    </div>

    <div class="flex justify-end gap-2 mt-5">

      <button
        type="button"
        onclick="openRaporImportExcel()"
        class="px-4 py-2 rounded-lg bg-slate-100">
        ← Kembali
      </button>

      <button
        type="button"
        onclick="saveRaporImportedMemorizations()"
        class="px-4 py-2 rounded-lg bg-emerald-600 text-white">
        ✅ Import ${rows.length} Data
      </button>

    </div>
  `;

}
async function saveRaporImportedMemorizations(){

  const st = window.raporState;
  const rows = window.raporImportRows || [];

  if(!st?.student_id){
    return toast('Murid belum dipilih','err');
  }

  if(!rows.length){
    return toast('Tidak ada data untuk diimport','err');
  }

  if(
    typeof isRaporStudentAllowed === 'function' &&
    !isRaporStudentAllowed(st.student_id)
  ){
    return toast(
      'Anda tidak memiliki akses untuk mengisi rapor murid ini',
      'err'
    );
  }

  const payload = rows.map(row => ({
    student_id: st.student_id,
    academic_year: st.academic_year,
    semester: st.semester,

    juz: row.juz,
    surah: row.surah,

    tajwid: row.tajwid,
    kelancaran: row.kelancaran,
    rata_rata: row.rata_rata,

    teacher_id: current.id
  }));

  const { data, error } =
    await sb
      .from('tahfidz_memorizations')
      .insert(payload)
      .select();

  if(error){

    console.error(error);

    return toast(
      'Import gagal: ' + error.message,
      'err'
    );

  }

  window.raporImportRows = [];

  toast(
    `${data?.length || payload.length} detail hafalan berhasil diimport`
  );

  closeModal();

  await loadAll();

  go('rapor');
}

async function saveRaporMemorization(e,id=''){
  e.preventDefault();

  const raporState = window.raporState || {};

  if(!raporState.student_id){
    return toast('Murid belum dipilih','err');
  }

  if(!raporState.academic_year){
    return toast('Tahun ajaran belum dipilih','err');
  }

  if(!raporState.semester){
    return toast('Semester belum dipilih','err');
  }

  const tajwid =
    $('rmTajwid').value === ''
      ? null
      : Number($('rmTajwid').value);

  const kelancaran =
    $('rmKelancaran').value === ''
      ? null
      : Number($('rmKelancaran').value);

  const rata_rata =
    (tajwid !== null && kelancaran !== null)
      ? Math.ceil((tajwid + kelancaran) / 2)
      : null;

  const payload = {
    student_id: raporState.student_id,
    academic_year: raporState.academic_year,
    semester: raporState.semester,

    juz: Number($('rmJuz').value),

    surah: $('rmSurah').value.trim(),

    tajwid,

    kelancaran,

    rata_rata,

    teacher_id: current.id,

    updated_at: new Date().toISOString()
  };

  if(!payload.juz){
    return toast('Juz wajib diisi','err');
  }

  if(!payload.surah){
    return toast('Nama surat wajib diisi','err');
  }

  if(tajwid === null){
    return toast('Nilai Tajwid wajib diisi','err');
  }

  if(kelancaran === null){
    return toast('Nilai Kelancaran wajib diisi','err');
  }

  let result;

  if(id){

    result = await sb
      .from('tahfidz_memorizations')
      .update(payload)
      .eq('id',id);

  }else{

    result = await sb
      .from('tahfidz_memorizations')
      .insert(payload);

  }

  if(result.error){
    console.error('Gagal menyimpan hafalan:',result.error);

    return toast(
      `Gagal menyimpan hafalan: ${result.error.message}`,
      'err'
    );
  }

  toast(
    id
      ? 'Data hafalan berhasil diperbarui'
      : 'Data hafalan berhasil disimpan'
  );

  closeModal();

  await loadAll();

  go('rapor');
}


async function deleteRaporMemorization(id){

  const record =
    cache.memorizations.find(
      x => x.id === id
    );


  if(!record){

    return toast(
      'Data hafalan tidak ditemukan',
      'err'
    );

  }


  if(
    !confirm(
      `Hapus hafalan ${record.surah || ''}?`
    )
  ){

    return;

  }


  const {error} =
    await sb
      .from(
        'tahfidz_memorizations'
      )
      .delete()
      .eq('id',id);


  if(error){

    return toast(
      error.message,
      'err'
    );

  }


  toast(
    'Detail hafalan berhasil dihapus'
  );


  await loadAll();


  go('rapor');

}
function printRapor(){


  try{

    /* =====================================================
       STATE RAPOR
    ===================================================== */

    const st =
      window.raporState || {};

    const semester =
      st.semester || '';

    const academic_year =
      st.academic_year || '';


    /* =====================================================
       VALIDASI MURID
    ===================================================== */

    if(!st.student_id){

      return toast(
        'Murid belum dipilih',
        'err'
      );

    }


    if(
      typeof isRaporStudentAllowed === 'function' &&
      !isRaporStudentAllowed(st.student_id)
    ){

      return toast(
        'Anda tidak memiliki akses ke murid ini',
        'err'
      );

    }


    const student =
      cache.students.find(
        x => x.id === st.student_id
      );


    if(!student){

      return toast(
        'Data murid tidak ditemukan',
        'err'
      );

    }


    /* =====================================================
       DATA RAPOR
    ===================================================== */

    const assessment =
      typeof getCurrentRapor === 'function'
        ? getCurrentRapor()
        : null;


    const memos =
      typeof getCurrentMemorizations === 'function'
        ? getCurrentMemorizations()
        : [];


    const cls =
      cache.classes.find(
        x => x.id === student.class_id
      );


    const hal =
      cache.halaqoh.find(
        x => x.id === student.halaqoh_id
      );


    /* =====================================================
       HITUNG ULANG NILAI TERBARU
       Jangan menggunakan nilai_akhir lama dari database.
    ===================================================== */

    const rataHafalan =
      typeof calcRaporHafalanAverage === 'function'
        ? calcRaporHafalanAverage(memos)
        : null;


    const nilaiSas =
      typeof calcRaporSas === 'function'
        ? calcRaporSas(
            assessment?.tajwid,
            assessment?.kelancaran
          )
        : null;


    const nilaiHarian =
      typeof calcRaporHarian === 'function'
        ? calcRaporHarian(
            assessment?.sikap,
            assessment?.nilai_target
          )
        : null;


    const nilaiAkhir =
      typeof calcRaporFinal === 'function'
        ? calcRaporFinal({
            rata_rata_hafalan: rataHafalan,
            nilai_sas: nilaiSas,
            nilai_harian: nilaiHarian
          })
        : null;


    /* =====================================================
       TANGGAL TERBIT
    ===================================================== */

    const tanggalTerbit =
      typeof getRaporTanggalTerbit === 'function'
        ? getRaporTanggalTerbit()
        : (
            settings?.rapor_tanggal_terbit ||
            ''
          );


    if(!tanggalTerbit){

      return toast(
        'Tanggal terbit rapor belum diatur oleh Koordinator',
        'err'
      );

    }


    const formatTanggal =
      value => {

        if(!value){
          return '-';
        }

        const d =
          new Date(`${value}T00:00:00`);

        if(Number.isNaN(d.getTime())){
          return value;
        }

        return d.toLocaleDateString(
          'id-ID',
          {
            day:'numeric',
            month:'long',
            year:'numeric'
          }
        );

      };


    const reportDate =
      formatTanggal(tanggalTerbit);


    const reportCity =
      settings?.report_city ||
      '';


    /* =====================================================
       GURU TAUHDZ
    ===================================================== */

    const teacher =
      cache.profiles.find(
        p => p.id === assessment?.teacher_id
      ) ||
      cache.profiles.find(
        p => p.id === current?.id
      ) ||
      null;


    const teacherName =
      teacher?.nama ||
      current?.nama ||
      '-';


    const teacherNipy =
      teacher?.nipy ||
      current?.nipy ||
      '';


    /* =====================================================
       KEPALA SEKOLAH
       Ambil dari settings bila tersedia.
    ===================================================== */

    const headmasterName =
      settings?.headmaster_name ||
      settings?.kepala_sekolah_nama ||
      '';


    const headmasterNip =
      settings?.headmaster_nip ||
      settings?.kepala_sekolah_nip ||
      '';


    /* =====================================================
       FORMAT ANGKA
    ===================================================== */

    const fmt =
      value => {

        if(
          value === null ||
          value === undefined ||
          value === ''
        ){

          return '';

        }

        const n =
          Number(value);

        if(Number.isNaN(n)){
          return '';
        }

        return Math.ceil(n).toString();

      };


    /* =====================================================
       SEKOLAH
    ===================================================== */

    const schoolName =
      settings?.institution_name ||
      'SDITQ Abu Bakr Ash-Shiddiq';


    const schoolAddress =
      settings?.institution_address ||
      '';


    /* =====================================================
       JENIS UJIAN
       HANYA SAS ATAU SAT
    ===================================================== */

    const jenisUjianLabel =
      String(
        assessment?.jenis_ujian ||
        'SAS'
      ).toUpperCase() === 'SAT'
        ? 'SAT'
        : 'SAS';


    /* =====================================================
       BARIS HAFALAN
       MAKSIMAL 31 BARIS
    ===================================================== */

    const rows = [];


    for(let i = 0; i < 31; i++){

      const m =
        memos[i];


      rows.push(`

        <tr>

          <td class="center">
            ${i + 1}
          </td>

          <td class="center">
            ${m ? esc(m.juz ?? '') : ''}
          </td>

          <td class="surah-cell">
            ${m ? esc(m.surah || '') : ''}
          </td>

          <td class="center">
            ${m ? fmt(m.tajwid) : ''}
          </td>

          <td class="center">
            ${m ? fmt(m.kelancaran) : ''}
          </td>

          <td class="center">
            ${m ? fmt(m.rata_rata) : ''}
          </td>

        </tr>

      `);

    }


    /* =====================================================
       CETAK HTML
    ===================================================== */

    const html = `

<!DOCTYPE html>

<html lang="id">

<head>

<meta charset="UTF-8">

<title>
  Rapor Tahfidz - ${esc(student.nama || '')}
</title>


<style>

  /* =====================================================
     PAGE A4
  ===================================================== */

  @page{

    size:A4 portrait;

    margin:0;

  }


  html,
  body{

    width:210mm;

    height:297mm;

    margin:0 !important;

    padding:0 !important;

    background:#fff;

  }


  body{

    font-family:
      Arial,
      Helvetica,
      sans-serif;

    color:#111;

    font-size:10px;

    -webkit-print-color-adjust:exact !important;

    print-color-adjust:exact !important;

  }


  /* =====================================================
     HALAMAN
  ===================================================== */

  .page{

    width:210mm;

    height:297mm;

    box-sizing:border-box;

    padding:
      8mm
      9mm
      6mm
      9mm;

    overflow:hidden;

    page-break-after:avoid;

    break-after:avoid;

  }


  /* =====================================================
     KOP
  ===================================================== */

  .school-header{

    text-align:center;

    margin-bottom:4mm;

  }


  .school-name{

    font-size:15px;

    font-weight:700;

    line-height:1.2;

    text-align:center;

  }


  .school-address{

    margin-top:1mm;

    font-size:9px;

    line-height:1.2;

    text-align:center;

  }


  .report-title{

    margin-top:2mm;

    font-size:15px;

    font-weight:700;

    text-align:center;

  }


  /* =====================================================
     IDENTITAS
  ===================================================== */

  .identity{

    width:100%;

    border-collapse:collapse;

    margin-top:4mm;

    margin-bottom:4mm;

    font-size:9.5px;

  }


  .identity td{

    padding:
      1.1mm
      1.2mm;

    vertical-align:top;

  }


  .identity .label{

    width:18mm;

    font-weight:600;

  }


  .identity .colon{

    width:3mm;

  }


  .identity .value{

    width:72mm;

  }


  .identity .label-right{

    width:22mm;

    font-weight:600;

  }


  .identity .value-right{

    width:45mm;

  }


  /* =====================================================
     TABEL HAFALAN
  ===================================================== */

  .main-table{

    width:100%;

    border-collapse:collapse;

    table-layout:fixed;

    font-size:8.5px;

    page-break-inside:avoid;

    break-inside:avoid;

  }


  .main-table th,
  .main-table td{

    border:1px solid #222;

    padding:
      1.2px
      3px;

    vertical-align:middle;

    line-height:1.05;

  }


  .main-table th{

    font-weight:700;

    text-align:center;

  }


  .main-table .col-no{

    width:7%;

  }


  .main-table .col-juz{

    width:9%;

  }


  .main-table .col-surah{

    width:37%;

  }


  .main-table .col-score{

    width:15.666%;

  }


  .center{

    text-align:center !important;

    vertical-align:middle !important;

  }


  /* NAMA SURAH BENAR-BENAR TENGAH */

  .surah-cell{

    text-align:center !important;

    vertical-align:middle !important;

    white-space:normal;

  }


  .main-table thead{

    display:table-header-group;

  }


  .main-table tbody{

    page-break-inside:avoid;

    break-inside:avoid;

  }


  .main-table tr{

    page-break-inside:avoid;

    break-inside:avoid;

  }


  /* =====================================================
     RINGKASAN NILAI
  ===================================================== */

  .summary-table{

    width:100%;

    border-collapse:collapse;

    table-layout:fixed;

    margin-top:3mm;

    font-size:8.5px;

    page-break-inside:avoid;

    break-inside:avoid;

  }


  .summary-table td{

    border:1px solid #222;

    padding:
      1.4px
      3px;

    vertical-align:middle;

    line-height:1.05;

  }


  .summary-label{

    width:52%;

    font-weight:600;

  }


  .summary-score{

    width:16%;

    text-align:center;

    font-weight:600;

  }


  .summary-head{

    text-align:center;

    font-weight:700;

  }


  /* =====================================================
     CATATAN
  ===================================================== */

  .catatan{

    margin-top:3mm;

    font-size:9px;

    line-height:1.3;

  }


  .catatan-label{

    display:inline-block;

    width:27mm;

    font-weight:600;

  }


  .catatan-colon{

    display:inline-block;

    width:3mm;

  }


  /* =====================================================
     TANDA TANGAN
     
     Posisi Guru dimulai di area kolom KELANCARAN.
     
     Tabel memakai:
     NO 7%
     JUZ 9%
     SURAH 37%
     TAJWID 15.666%
     KELANCARAN 15.666%
     RATA-RATA 15.666%
     
     Awal KELANCARAN =
     7 + 9 + 37 + 15.666
     = 68.666%
     
     Kita letakkan guru mulai sekitar 68.5%.
  ===================================================== */

  .sign-area{

    margin-top:5mm;

    width:100%;

    page-break-inside:avoid;

    break-inside:avoid;

  }


  .sign-grid{

    display:grid;

    grid-template-columns:
      52%
      16.5%
      15.5%
      16%;

    width:100%;

    align-items:start;

  }


  /* =====================================================
     ORANG TUA
  ===================================================== */

  .sign-parent{

    grid-column:1 / 3;

    text-align:left;

    font-size:9px;

    line-height:1.25;

  }


  .parent-space{

    height:14mm;

  }


  /* =====================================================
     GURU TAUHDZ
  ===================================================== */

  .sign-teacher{

    grid-column:3 / 5;

    text-align:left;

    font-size:9px;

    line-height:1.25;

    padding-left:0;

  }


  .teacher-date{

    margin-bottom:0.8mm;

    white-space:nowrap;

  }


  .teacher-title{

    white-space:nowrap;

  }


  .teacher-space{

    height:11mm;

  }


  .teacher-name{

    font-weight:700;

    text-decoration:underline;

  }


  .teacher-nipy{

    margin-top:0.6mm;

  }


  /* =====================================================
     KEPALA SEKOLAH
     
     BLOK DITENGAHKAN,
     TEKS TETAP RATA KIRI.
  ===================================================== */

  .sign-headmaster{

    grid-column:2 / 4;

    justify-self:center;

    width:100%;

    margin-top:5mm;

    text-align:left;

    font-size:9px;

    line-height:1.25;

  }


  .headmaster-space{

    height:11mm;

  }


  .headmaster-title{

    font-weight:700;

  }


  .headmaster-name{

    margin-top:0.8mm;

    font-weight:700;

    text-decoration:underline;

  }


  .headmaster-nipy{

    margin-top:0.6mm;

  }


  /* =====================================================
     PRINT
  ===================================================== */

  @media print{

    html,
    body{

      width:210mm !important;

      height:297mm !important;

      margin:0 !important;

      padding:0 !important;

    }


    .page{

      width:210mm !important;

      height:297mm !important;

      margin:0 !important;

      padding:
        8mm
        9mm
        6mm
        9mm !important;

      overflow:hidden !important;

      page-break-after:avoid !important;

      break-after:avoid !important;

    }

  }

</style>

</head>


<body>

<div class="page">


  <!-- ===================================================
       KOP SEKOLAH
  ==================================================== -->

  <div class="school-header">

    <div class="school-name">
      ${esc(schoolName)}
    </div>

    ${
      schoolAddress
        ? `
          <div class="school-address">
            ${esc(schoolAddress)}
          </div>
        `
        : ''
    }

    <div class="report-title">
      RAPOR TAHFIDZ
    </div>

  </div>


  <!-- ===================================================
       IDENTITAS MURID
  ==================================================== -->

  <table class="identity">

    <tr>

      <td class="label">
        Nama
      </td>

      <td class="colon">
        :
      </td>

      <td class="value">
        ${esc(student.nama || '-')}
      </td>


      <td class="label-right">
        Kelas
      </td>

      <td class="colon">
        :
      </td>

      <td class="value-right">
        ${esc(cls?.nama || '-')}
      </td>

    </tr>


    <tr>

      <td class="label">
        NIS/NISN
      </td>

      <td class="colon">
        :
      </td>

      <td class="value">
        ${esc(student.nis || student.nisn || '-')}
      </td>


      <td class="label-right">
        Halaqoh
      </td>

      <td class="colon">
        :
      </td>

      <td class="value-right">
        ${esc(hal?.nama || '-')}
      </td>

    </tr>


    <tr>

      <td class="label">
        Nama Sekolah
      </td>

      <td class="colon">
        :
      </td>

      <td class="value">
        ${esc(schoolName)}
      </td>


      <td class="label-right">
        Semester
      </td>

      <td class="colon">
        :
      </td>

      <td class="value-right">
        ${esc(semester || '-')}
      </td>

    </tr>


    <tr>

      <td class="label">
        Alamat Sekolah
      </td>

      <td class="colon">
        :
      </td>

      <td class="value">
        ${esc(schoolAddress || '-')}
      </td>


      <td class="label-right">
        Tahun Ajaran
      </td>

      <td class="colon">
        :
      </td>

      <td class="value-right">
        ${esc(academic_year || '-')}
      </td>

    </tr>

  </table>


  <!-- ===================================================
       TABEL HAFALAN
  ==================================================== -->

  <table class="main-table">

    <colgroup>

      <col class="col-no">

      <col class="col-juz">

      <col class="col-surah">

      <col class="col-score">

      <col class="col-score">

      <col class="col-score">

    </colgroup>


    <thead>

      <tr>

        <th>
          NO
        </th>

        <th>
          JUZ
        </th>

        <th>
          NAMA SURAH
        </th>

        <th>
          TAJWID
        </th>

        <th>
          KELANCARAN
        </th>

        <th>
          RATA-RATA
        </th>

      </tr>

    </thead>


    <tbody>

      ${rows.join('')}

    </tbody>

  </table>


  <!-- ===================================================
       NILAI
  ==================================================== -->

  <table class="summary-table">

    <tr>

      <td class="summary-label">
        Nilai Ujian Praktik
      </td>

      <td class="summary-head">
        TAJWID
      </td>

      <td class="summary-head">
        KELANCARAN
      </td>

      <td class="summary-head">
        ${esc(jenisUjianLabel)}
      </td>

    </tr>


    <tr>

      <td></td>

      <td class="summary-score">
        ${fmt(assessment?.tajwid)}
      </td>

      <td class="summary-score">
        ${fmt(assessment?.kelancaran)}
      </td>

      <td class="summary-score">
        ${fmt(nilaiSas)}
      </td>

    </tr>


    <tr>

      <td class="summary-label">
        Rata-rata Hafalan
      </td>

      <td
        colspan="3"
        class="summary-score">

        ${fmt(rataHafalan)}

      </td>

    </tr>


    <tr>

      <td class="summary-label">
        Nilai Harian
      </td>

      <td
        colspan="3"
        class="summary-score">

        ${fmt(nilaiHarian)}

      </td>

    </tr>


    <tr>

      <td class="summary-label">
        Nilai Akhir
      </td>

      <td
        colspan="3"
        class="summary-score">

        ${fmt(nilaiAkhir)}

      </td>

    </tr>

  </table>


  <!-- ===================================================
       CATATAN GURU
  ==================================================== -->

  <div class="catatan">

    <span class="catatan-label">
      Catatan Guru
    </span>

    <span class="catatan-colon">
      :
    </span>

    <span>
      ${esc(assessment?.catatan || '')}
    </span>

  </div>


  <!-- ===================================================
       TANDA TANGAN
  ==================================================== -->

  <div class="sign-area">

    <div class="sign-grid">


      <!-- ===============================================
           ORANG TUA / WALI
      ================================================ -->

      <div class="sign-parent">

        <div>
          Orang Tua/Wali
        </div>

        <div class="parent-space"></div>

        <div>
          (........................)
        </div>

      </div>


      <!-- ===============================================
           GURU TAHFIDZ
      ================================================ -->

      <div class="sign-teacher">

        <div class="teacher-date">

          ${
            reportCity
              ? `${esc(reportCity)}, `
              : ''
          }

          ${esc(reportDate)}

        </div>


        <div class="teacher-title">
          Guru Tahfidz
        </div>


        <div class="teacher-space"></div>


        <div class="teacher-name">
          ${esc(teacherName)}
        </div>


        <div class="teacher-nipy">

          NIPY.
          ${esc(teacherNipy || '-')}

        </div>

      </div>


      <!-- ===============================================
           KEPALA SEKOLAH
      ================================================ -->

      <div class="sign-headmaster">

        <div>
          Mengetahui,
        </div>


        <div class="headmaster-title">

          Kepala SDITQ Abu Bakr Ash-Shiddiq

        </div>


        <div class="headmaster-space"></div>


        ${
          headmasterName
            ? `
              <div class="headmaster-name">
                ${esc(headmasterName)}
              </div>

              <div class="headmaster-nipy">
                NIPY. ${esc(headmasterNip || '-')}
              </div>
            `
            : ''
        }

      </div>


    </div>

  </div>


</div>


<script>

  window.onload = function(){

    setTimeout(function(){

      window.print();

    },500);

  };


  window.onafterprint = function(){

    setTimeout(function(){

      window.close();

    },300);

  };

</script>


</body>

</html>

    `;


    /* =====================================================
       WINDOW CETAK
    ===================================================== */

    const win =
      window.open(
        '',
        '_blank'
      );


    if(!win){

      return toast(
        'Jendela cetak diblokir browser. Izinkan pop-up untuk aplikasi ini.',
        'err'
      );

    }


    win.document.open();

    win.document.write(html);

    win.document.close();


  }catch(error){

    console.error(
      'printRapor error:',
      error
    );

    toast(
      'Gagal mencetak rapor: ' +
      (
        error?.message ||
        error
      ),
      'err'
    );

  }

}
/* =========================================================
   RAPOR TAHFIDZ
   EXPORT EXCEL BERDASARKAN TEMPLATE ASLI

   Template:
   ./rapor-template.xlsx

   Sheet master:
   Rapor
========================================================= */


/* =========================================================
   LOAD EXCELJS
========================================================= */

async function ensureExcelJS(){

  if(window.ExcelJS){

    return window.ExcelJS;

  }

  throw new Error(
    'ExcelJS belum dimuat. Pastikan script ExcelJS sudah ditambahkan.'
  );

}


/* =========================================================
   LOAD TEMPLATE EXCEL
========================================================= */

async function loadRaporExcelTemplate(){

  const ExcelJS =
    await ensureExcelJS();


  const response =
    await fetch(
      './rapor-template.xlsx',
      {
        cache:'no-store'
      }
    );


  if(!response.ok){

    throw new Error(
      'Template rapor tidak ditemukan. Pastikan file rapor-template.xlsx berada satu folder dengan aplikasi.'
    );

  }


  const buffer =
    await response.arrayBuffer();


  const workbook =
    new ExcelJS.Workbook();


  await workbook.xlsx.load(
    buffer
  );


  const template =
    workbook.getWorksheet(
      'Rapor'
    );


  if(!template){

    throw new Error(
      'Sheet "Rapor" tidak ditemukan di template Excel.'
    );

  }


  return {
    workbook,
    template
  };

}


/* =========================================================
   SANITASI NAMA SHEET
========================================================= */

function sanitizeRaporSheetName(
  name,
  usedNames = []
){

  let result =
    String(
      name ||
      'Rapor'
    )
      .trim()
      .replace(
        /[\\\/\?\*\[\]\:]/g,
        ''
      )
      .replace(
        /\s+/g,
        ' '
      );


  if(!result){

    result =
      'Rapor';

  }


  /*
   * Maksimal 31 karakter Excel.
   */

  result =
    result.slice(
      0,
      31
    );


  /*
   * Excel tidak mengizinkan
   * nama sheet yang sama.
   */

  const original =
    result;


  let counter = 2;


  while(
    usedNames.some(
      x =>
        String(x).toLowerCase() ===
        result.toLowerCase()
    )
  ){

    const suffix =
      ` (${counter})`;

    result =
      original.slice(
        0,
        31 - suffix.length
      ) +
      suffix;

    counter++;

  }


  return result;

}


/* =========================================================
   COPY STYLE CELL
========================================================= */

function cloneRaporCellStyle(
  sourceCell,
  targetCell
){

  if(!sourceCell || !targetCell){

    return;

  }


  /*
   * ExcelJS style object.
   * JSON clone cukup untuk style template.
   */

  if(sourceCell.style){

    targetCell.style =
      JSON.parse(
        JSON.stringify(
          sourceCell.style
        )
      );

  }


  if(sourceCell.numFmt){

    targetCell.numFmt =
      sourceCell.numFmt;

  }


  if(sourceCell.font){

    targetCell.font =
      JSON.parse(
        JSON.stringify(
          sourceCell.font
        )
      );

  }


  if(sourceCell.fill){

    targetCell.fill =
      JSON.parse(
        JSON.stringify(
          sourceCell.fill
        )
      );

  }


  if(sourceCell.border){

    targetCell.border =
      JSON.parse(
        JSON.stringify(
          sourceCell.border
        )
      );

  }


  if(sourceCell.alignment){

    targetCell.alignment =
      JSON.parse(
        JSON.stringify(
          sourceCell.alignment
        )
      );

  }


  if(sourceCell.protection){

    targetCell.protection =
      JSON.parse(
        JSON.stringify(
          sourceCell.protection
        )
      );

  }

}


/* =========================================================
   COPY WORKSHEET
   MEMPERTAHANKAN FORMAT TEMPLATE
========================================================= */

function cloneRaporWorksheet(workbook, source, sheetName){

  /*
   * Buat worksheet kosong terlebih dahulu.
   */
  const target = workbook.addWorksheet(sheetName);

  /*
   * Salin MODEL worksheet secara utuh.
   *
   * Ini jauh lebih aman daripada menyalin:
   * - cell satu per satu
   * - row satu per satu
   * - merge satu per satu
   * - page setup satu per satu
   *
   * karena struktur worksheet berasal langsung
   * dari template asli.
   */
  const model = JSON.parse(
    JSON.stringify(source.model)
  );

  /*
   * ID worksheet harus mengikuti worksheet baru.
   */
  model.id = target.id;

  /*
   * Nama sheet baru.
   */
  model.name = sheetName;

  /*
   * Terapkan seluruh model template
   * ke worksheet baru.
   */
  target.model = model;

  /*
   * ExcelJS menyimpan gambar sebagai object
   * terpisah dari model worksheet.
   *
   * Jadi gambar kita salin kembali.
   */
  try {

    const images = source.getImages();

    if(Array.isArray(images)){

      images.forEach(image => {

        try {

          target.addImage(
            image.imageId,
            image.range
          );

        } catch(err){

          console.warn(
            'Gagal menyalin gambar ke sheet:',
            sheetName,
            err
          );

        }

      });

    }

  } catch(err){

    console.warn(
      'Tidak ada gambar yang dapat disalin:',
      sheetName,
      err
    );

  }

  return target;
}


/* =========================================================
   FORMAT NILAI
========================================================= */

function exportRaporCeil(
  value
){

  if(
    value === null ||
    value === undefined ||
    value === ''
  ){

    return null;

  }


  const number =
    Number(value);


  if(
    Number.isNaN(number)
  ){

    return null;

  }


  return Math.ceil(
    number
  );

}


/* =========================================================
   HITUNG SAS / SAT
========================================================= */

function exportRaporSas(
  tajwid,
  kelancaran
){

  const t =
    Number(tajwid);


  const k =
    Number(kelancaran);


  if(
    Number.isNaN(t) ||
    Number.isNaN(k)
  ){

    return null;

  }


  return Math.ceil(
    (t + k) / 2
  );

}


/* =========================================================
   HITUNG NILAI HARIAN
========================================================= */

function exportRaporHarian(
  sikap,
  target
){

  const s =
    Number(sikap);


  const t =
    Number(target);


  if(
    Number.isNaN(s) ||
    Number.isNaN(t)
  ){

    return null;

  }


  return Math.ceil(
    (s + t) / 2
  );

}


/* =========================================================
   HITUNG RATA-RATA HAFALAN
========================================================= */

function exportRaporHafalanAverage(
  memos
){

  const values =
    (memos || [])
      .map(
        m =>
          Number(
            m?.rata_rata
          )
      )
      .filter(
        n =>
          !Number.isNaN(n)
      );


  if(!values.length){

    return null;

  }


  const total =
    values.reduce(
      (sum,n) =>
        sum + n,
      0
    );


  return Math.ceil(
    total / values.length
  );

}


/* =========================================================
   HITUNG NILAI AKHIR
========================================================= */

function exportRaporFinal(
  rataHafalan,
  nilaiSas,
  nilaiHarian
){

  const values = [
    rataHafalan,
    nilaiSas,
    nilaiHarian
  ]
    .map(Number)
    .filter(
      n =>
        !Number.isNaN(n)
    );


  if(values.length !== 3){

    return null;

  }


  return Math.ceil(
    (
      rataHafalan +
      nilaiSas +
      nilaiHarian
    ) / 3
  );

}


/* =========================================================
   TANGGAL RAPOR
========================================================= */

function exportRaporDate(
  value
){

  if(!value){

    return '';

  }


  const date =
    new Date(
      `${value}T00:00:00`
    );


  if(
    Number.isNaN(
      date.getTime()
    )
  ){

    return String(value);

  }


  return date.toLocaleDateString(
    'id-ID',
    {
      day:'numeric',
      month:'long',
      year:'numeric'
    }
  );

}


/* =========================================================
   AMBIL DATA RAPOR SATU MURID
========================================================= */

async function getExportRaporData(
  student
){

  if(!student){

    throw new Error(
      'Data murid tidak ditemukan.'
    );

  }


  const academicYear =
    window.raporState?.academic_year ||
    '';


  const semester =
    window.raporState?.semester ||
    '';


  if(!academicYear){

    throw new Error(
      'Tahun ajaran belum dipilih.'
    );

  }


  if(!semester){

    throw new Error(
      'Semester belum dipilih.'
    );

  }


  /*
   * ASSESSMENT
   */

  const {
    data: assessment,
    error: assessmentError
  } =
    await sb
      .from(
        'tahfidz_assessments'
      )
      .select('*')
      .eq(
        'student_id',
        student.id
      )
      .eq(
        'academic_year',
        academicYear
      )
      .eq(
        'semester',
        semester
      )
      .maybeSingle();


  if(assessmentError){

    throw assessmentError;

  }


  /*
   * MEMORIZATION
   */

  const {
    data: memos,
    error: memoError
  } =
    await sb
      .from(
        'tahfidz_memorizations'
      )
      .select('*')
      .eq(
        'student_id',
        student.id
      )
      .eq(
        'academic_year',
        academicYear
      )
      .eq(
        'semester',
        semester
      )
      .order(
        'id',
        {
          ascending:true
        }
      );


  if(memoError){

    throw memoError;

  }
  /*
   * SAMAKAN URUTAN EXCEL DENGAN DETAIL HAFALAN
   * Urutan:
   * 1. Juz
   * 2. Urutan surat berdasarkan RAPOR_SURAH_LIST
   */

  const sortedMemos =
    (memos || [])
      .slice()
      .sort((a,b) => {

        const juzA =
          Number(a.juz || 0);

        const juzB =
          Number(b.juz || 0);

        if(juzA !== juzB){

          return juzA - juzB;

        }

        const surahA =
          RAPOR_SURAH_LIST.indexOf(
            String(a.surah || '').trim()
          );

        const surahB =
          RAPOR_SURAH_LIST.indexOf(
            String(b.surah || '').trim()
          );

        const orderA =
          surahA === -1
            ? 999
            : surahA;

        const orderB =
          surahB === -1
            ? 999
            : surahB;

        return orderA - orderB;

      });

  /*
   * KELAS
   */

  const cls =
    cache.classes.find(
      x =>
        x.id ===
        student.class_id
    );


  /*
   * HALAQOH
   */

  const hal =
    cache.halaqoh.find(
      x =>
        x.id ===
        student.halaqoh_id
    );


  /*
   * NILAI
   */

const rataHafalan =
  exportRaporHafalanAverage(
    sortedMemos
  );


  const nilaiSas =
    exportRaporSas(
      assessment?.tajwid,
      assessment?.kelancaran
    );


  const nilaiHarian =
    exportRaporHarian(
      assessment?.sikap,
      assessment?.nilai_target
    );


  const nilaiAkhir =
    exportRaporFinal(
      rataHafalan,
      nilaiSas,
      nilaiHarian
    );


  /*
   * GURU
   */

  const teacher =
    cache.profiles.find(
      p =>
        p.id ===
        assessment?.teacher_id
    ) ||
    cache.profiles.find(
      p =>
        p.id ===
        current?.id
    ) ||
    null;


  /*
   * TANGGAL TERBIT
   */

  const tanggalTerbit =
    settings?.rapor_tanggal_terbit ||
    '';


  return {

    student,

    cls,

    hal,

    assessment,

memos:
  sortedMemos,

    rataHafalan,

    nilaiSas,

    nilaiHarian,

    nilaiAkhir,

    teacher,

    academicYear,

    semester,

    tanggalTerbit

  };

}


/* =========================================================
   ISI SATU SHEET RAPOR
========================================================= */

function fillRaporExcelSheet(
  sheet,
  data
){

  const {
    student,
    cls,
    hal,
    assessment,
    memos,
    rataHafalan,
    nilaiSas,
    nilaiHarian,
    nilaiAkhir,
    teacher,
    academicYear,
    semester,
    tanggalTerbit
  } = data;


  /* =====================================================
     SETTINGS
  ===================================================== */

  const schoolName =
    settings?.institution_name ||
    'SDITQ Abu Bakr Ash-Shiddiq';


  const schoolAddress =
    settings?.institution_address ||
    '';


  const reportCity =
    settings?.report_city ||
    '';


  const teacherName =
    teacher?.nama ||
    current?.nama ||
    '-';


  const teacherNipy =
    teacher?.nipy ||
    current?.nipy ||
    '';


  const headmasterName =
    settings?.headmaster_name ||
    settings?.kepala_sekolah_nama ||
    '';


  const headmasterNip =
    settings?.headmaster_nip ||
    settings?.kepala_sekolah_nip ||
    '';


  const jenisUjian =
    String(
      assessment?.jenis_ujian ||
      'SAS'
    ).toUpperCase() === 'SAT'
      ? 'SAT'
      : 'SAS';


  /* =====================================================
     IDENTITAS
     
     Berdasarkan template asli:
     
     F4 = Nama Murid
     F5 = NIS/NISN
     F6 = Nama Sekolah
     F7 = Alamat Sekolah

     J4 = Kelas
     J5 = Halaqoh
     J6 = Semester
     J7 = Tahun Ajaran
  ===================================================== */

  sheet.getCell('F4').value =
    student?.nama || '';


  sheet.getCell('F5').value =
    student?.nis ||
    student?.nisn ||
    '';


  sheet.getCell('F6').value =
    schoolName;


  sheet.getCell('F7').value =
    schoolAddress;


  sheet.getCell('J4').value =
    cls?.nama || '';


  sheet.getCell('J5').value =
    hal?.nama || '';


  sheet.getCell('J6').value =
    semester || '';


  sheet.getCell('J7').value =
    academicYear || '';


  /* =====================================================
     DATA HAFALAN
     
     Template asli:
     
     B10:B11 = NO
     C10:E11 = JUZ
     F10:F11 = NAMA SURAT
     G10:G11 = TAJWID
     H10:H11 = KELANCARAN
     I10:J11 = RATA-RATA

     Data:
     baris 12 - 42
  ===================================================== */

  for(
    let index = 0;
    index < 31;
    index++
  ){

    const row =
      12 + index;


    const memo =
      memos[index] ||
      null;


    /*
     * NO
     */

    sheet.getCell(
      `B${row}`
    ).value =
      index + 1;


    /*
     * JUZ
     *
     * C:E merupakan merged cell.
     * Tulis hanya C.
     */

    sheet.getCell(
      `C${row}`
    ).value =
      memo?.juz ??
      '';


    /*
     * SURAH
     */

    sheet.getCell(
      `F${row}`
    ).value =
      memo?.surah ||
      '';


    /*
     * TAJWID
     */

    sheet.getCell(
      `G${row}`
    ).value =
      exportRaporCeil(
        memo?.tajwid
      );


    /*
     * KELANCARAN
     */

    sheet.getCell(
      `H${row}`
    ).value =
      exportRaporCeil(
        memo?.kelancaran
      );


    /*
     * RATA-RATA
     *
     * I:J merged.
     */

    sheet.getCell(
      `I${row}`
    ).value =
      exportRaporCeil(
        memo?.rata_rata
      );

  }


  /* =====================================================
     NILAI UJIAN PRAKTIK
     
     B43:F44 = label
     G43 = TAJWID
     H43 = KELANCARAN
     I43:J43 = SAS/SAT
     G44 = nilai tajwid
     H44 = nilai kelancaran
     I44:J44 = nilai SAS/SAT
  ===================================================== */

  sheet.getCell(
    'G43'
  ).value =
    'TAJWID';


  sheet.getCell(
    'H43'
  ).value =
    'KELANCARAN';


  sheet.getCell(
    'I43'
  ).value =
    jenisUjian;


  sheet.getCell(
    'G44'
  ).value =
    exportRaporCeil(
      assessment?.tajwid
    );


  sheet.getCell(
    'H44'
  ).value =
    exportRaporCeil(
      assessment?.kelancaran
    );


  sheet.getCell(
    'I44'
  ).value =
    nilaiSas;


  /* =====================================================
     NILAI HARIAN
     
     I45
  ===================================================== */

  sheet.getCell(
    'I45'
  ).value =
    nilaiHarian;


  /* =====================================================
     NILAI AKHIR
     
     I46
  ===================================================== */

  sheet.getCell(
    'I46'
  ).value =
    nilaiAkhir;


  /* =====================================================
     CATATAN GURU
     
     E48:J49 merged
  ===================================================== */

  sheet.getCell(
    'E48'
  ).value =
    assessment?.catatan ||
    '';


  /* =====================================================
     TANGGAL TERBIT
     
     H51
  ===================================================== */

  const tanggalText =
    reportCity
      ? `${reportCity}, ${exportRaporDate(tanggalTerbit)}`
      : exportRaporDate(tanggalTerbit);


  sheet.getCell(
    'H51'
  ).value =
    tanggalText;


  /* =====================================================
     GURU TAHFIDZ
     
     H52
     H56
     H57
  ===================================================== */

  sheet.getCell(
    'H52'
  ).value =
    'Guru Tahfidz';


  sheet.getCell(
    'H56'
  ).value =
    teacherName;


  sheet.getCell(
    'H57'
  ).value =
    teacherNipy
      ? `NIPY. ${teacherNipy}`
      : 'NIPY. -';


  /* =====================================================
     KEPALA SEKOLAH
     
     Template asli:
     
     G58 = Mengetahui,
     G59 = Kepala Sekolah
     G63 = Nama
     G64 = NIPY
  ===================================================== */

  sheet.getCell(
    'G58'
  ).value =
    'Mengetahui,';


  sheet.getCell(
    'G59'
  ).value =
    'Kepala Sekolah';


  sheet.getCell(
    'G63'
  ).value =
    headmasterName ||
    '';


  sheet.getCell(
    'G64'
  ).value =
    headmasterNip
      ? `NIPY. ${headmasterNip}`
      : 'NIPY. -';


  /* =====================================================
     PASTIKAN SHEET DIMULAI DARI A1
  ===================================================== */

  sheet.views = [
    {
      state:'normal',
      showGridLines:false
    }
  ];


  /*
   * Jangan mengubah ukuran/template.
   * Page setup tetap berasal dari template.
   */

}


/* =========================================================
   DAPATKAN MURID YANG BOLEH DIEXPORT
========================================================= */

function getRaporStudentsForExport(){

  /*
   * KOORDINATOR
   * = semua murid aktif
   */

  if(
    current?.role ===
    'koordinator'
  ){

    return cache.students
      .filter(
        s =>
          s.aktif !== false
      )
      .sort(
        (a,b) =>
          String(
            a.nama || ''
          ).localeCompare(
            String(
              b.nama || ''
            ),
            'id'
          )
      );

  }


  /*
   * GURU
   *
   * Hanya murid yang berada
   * di halaqoh yang diampu.
   */

  const halaqohIds =
    cache.teacherHalaqoh
      .filter(
        x =>
          x.teacher_id ===
          current.id
      )
      .map(
        x =>
          x.halaqoh_id
      );


  return cache.students
    .filter(
      s =>
        s.aktif !== false &&
        halaqohIds.includes(
          s.halaqoh_id
        )
    )
    .sort(
      (a,b) =>
        String(
          a.nama || ''
        ).localeCompare(
          String(
            b.nama || ''
          ),
          'id'
        )
    );

}


/* =========================================================
   VALIDASI DATA RAPOR
========================================================= */

function validateExportRaporState(){

  if(!window.raporState){

    throw new Error(
      'State Rapor belum tersedia.'
    );

  }


  if(
    !window.raporState.academic_year
  ){

    throw new Error(
      'Tahun ajaran belum dipilih.'
    );

  }


  if(
    !window.raporState.semester
  ){

    throw new Error(
      'Semester belum dipilih.'
    );

  }


  if(
    !settings?.rapor_tanggal_terbit
  ){

    throw new Error(
      'Tanggal terbit rapor belum diatur oleh Koordinator.'
    );

  }

}


/* =========================================================
   EXPORT SATU MURID
========================================================= */

/* =========================================================
   EXPORT RAPOR TAHFIDZ - TEMPLATE 1 SHEET
   Template:
   rapor-template.xlsx

   Hasil:
   1 file XLSX
   1 sheet = 1 murid
   ========================================================= */

function xmlEscapeRapor(value){
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}


/* ---------------------------------------------------------
   Set isi cell tanpa merusak style cell
   --------------------------------------------------------- */
function setRaporCellXml(xml, cellRef, value, type = 'string'){

  const re = new RegExp(
    `<c\\s+r="${cellRef}"[^>]*?(?:>.*?<\\/c>|\\/>)`,
    's'
  );

  const match = xml.match(re);

  if(!match){
    console.warn('Cell tidak ditemukan di template:', cellRef);
    return xml;
  }

  const oldCell = match[0];

  // Pertahankan style asli
  const styleMatch = oldCell.match(/\ss="([^"]+)"/);
  const style = styleMatch
    ? ` s="${styleMatch[1]}"`
    : '';

  // Kosongkan cell
  if(value === null || value === undefined || value === ''){

    const newCell =
      `<c r="${cellRef}"${style}/>`;


    return xml.replace(
      oldCell,
      newCell
    );
  }

  // Angka
  if(type === 'number' && Number.isFinite(Number(value))){

    const newCell =
      `<c r="${cellRef}"${style}><v>${Number(value)}</v></c>`;

    return xml.replace(
      oldCell,
      newCell
    );
  }

  // String
  const text = xmlEscapeRapor(value);

  const newCell =
    `<c r="${cellRef}"${style} t="inlineStr">` +
      `<is><t xml:space="preserve">${text}</t></is>` +
    `</c>`;

  return xml.replace(
    oldCell,
    newCell
  );
}


/* ---------------------------------------------------------
   Format angka rapor
   --------------------------------------------------------- */
function raporExcelNumber(value){

  if(
    value === null ||
    value === undefined ||
    value === '' ||
    Number.isNaN(Number(value))
  ){
    return '';
  }

  return Math.round(Number(value));
}


/* ---------------------------------------------------------
   Nama sheet Excel
   Maksimal 31 karakter
   --------------------------------------------------------- */
function makeUniqueRaporSheetName(
  nama,
  usedNames
){

  let base = String(
    nama || 'Rapor'
  )
    .replace(/[\\\/\?\*\[\]\:]/g, '')
    .trim();

  if(!base){
    base = 'Rapor';
  }

  base = base.substring(0, 31);

  let name = base;
  let counter = 2;

  while(
    usedNames.has(
      name.toLowerCase()
    )
  ){

    const suffix = ` (${counter})`;

    name =
      base.substring(
        0,
        31 - suffix.length
      ) +
      suffix;

    counter++;
  }

  usedNames.add(
    name.toLowerCase()
  );

  return name;
}


/* ---------------------------------------------------------
   Ambil murid yang boleh diekspor

   Koordinator:
   semua murid aktif

   Guru:
   hanya murid dari halaqoh yang dia ampu
   --------------------------------------------------------- */



/* ---------------------------------------------------------
   Ambil tanggal terbit
   --------------------------------------------------------- */
function getRaporExportTanggalTerbit(){

  return (
    settings?.rapor_tanggal_terbit ||
    ''
  );
}


/* ---------------------------------------------------------
   Format tanggal Indonesia
   --------------------------------------------------------- */
function formatRaporExportDate(value){

  if(!value){
    return '';
  }

  const date =
    new Date(`${value}T00:00:00`);

  if(
    Number.isNaN(
      date.getTime()
    )
  ){
    return value;
  }

  return date.toLocaleDateString(
    'id-ID',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  );
}
/* =========================================================
   RAPOR TAHFIDZ
   EXPORT EXCEL - TEMPLATE BARU
   ---------------------------------------------------------
   Template:
   ./rapor-template.xlsx

   ATURAN:
   - 1 murid = 1 sheet
   - Template asli dipakai sebagai master
   - Format, merge, border, font, ukuran, dan page setup
     berasal dari template
   - Tidak mengubah teks statis template
   ========================================================= */


/* =========================================================
   EXCELJS
========================================================= */

async function raporExcelEnsureExcelJS(){

  if(window.ExcelJS){
    return window.ExcelJS;
  }

  throw new Error(
    'ExcelJS belum dimuat. Pastikan script ExcelJS tersedia.'
  );

}


/* =========================================================
   LOAD TEMPLATE
========================================================= */

async function raporExcelLoadTemplate(){

  const ExcelJS =
    await raporExcelEnsureExcelJS();

  const response =
    await fetch(
      './rapor-template.xlsx',
      {
        cache: 'no-store'
      }
    );

  if(!response.ok){

    throw new Error(
      'File rapor-template.xlsx tidak ditemukan. ' +
      'Pastikan file berada satu folder dengan aplikasi.'
    );

  }

  const buffer =
    await response.arrayBuffer();

  const workbook =
    new ExcelJS.Workbook();

  await workbook.xlsx.load(buffer);

  const sheet =
    workbook.worksheets[0];

  if(!sheet){

    throw new Error(
      'Template rapor tidak memiliki worksheet.'
    );

  }

  return {
    workbook,
    sheet
  };

}


/* =========================================================
   HELPER NILAI
========================================================= */

function raporExcelNumber(value){

  if(
    value === null ||
    value === undefined ||
    value === ''
  ){
    return null;
  }

  const n =
    Number(value);

  if(Number.isNaN(n)){
    return null;
  }

  return Math.ceil(n);

}


function raporExcelText(value){

  if(
    value === null ||
    value === undefined
  ){
    return '';
  }

  return String(value);

}


/* =========================================================
   FORMAT TANGGAL
========================================================= */

function raporExcelFormatDate(value){

  if(!value){
    return '';
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if(Number.isNaN(date.getTime())){
    return String(value);
  }

  return date.toLocaleDateString(
    'id-ID',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  );

}


/* =========================================================
   NAMA SHEET
========================================================= */

function raporExcelSafeSheetName(
  name,
  usedNames
){

  let base =
    String(
      name ||
      'Rapor'
    )
      .replace(
        /[\\\/\?\*\[\]\:]/g,
        ''
      )
      .trim();

  if(!base){
    base = 'Rapor';
  }

  base =
    base.substring(
      0,
      31
    );

  let result =
    base;

  let counter =
    2;

  while(
    usedNames.has(
      result.toLowerCase()
    )
  ){

    const suffix =
      ` (${counter})`;

    result =
      base.substring(
        0,
        31 - suffix.length
      ) +
      suffix;

    counter++;

  }

  usedNames.add(
    result.toLowerCase()
  );

  return result;

}


/* =========================================================
   COPY WORKSHEET TEMPLATE
   ---------------------------------------------------------
   Digunakan untuk membuat sheet baru dengan struktur
   dan format yang sama dengan template.
========================================================= */

function raporExcelCopyWorksheet(
  workbook,
  sourceSheet,
  newName
){

  const targetSheet =
    workbook.addWorksheet(
      newName
    );


  /* -------------------------------------------------------
     PROPERTIES
  ------------------------------------------------------- */

  targetSheet.properties =
    JSON.parse(
      JSON.stringify(
        sourceSheet.properties || {}
      )
    );


  /* -------------------------------------------------------
     PAGE SETUP
  ------------------------------------------------------- */

  targetSheet.pageSetup =
    JSON.parse(
      JSON.stringify(
        sourceSheet.pageSetup || {}
      )
    );


  targetSheet.pageMargins =
    JSON.parse(
      JSON.stringify(
        sourceSheet.pageMargins || {}
      )
    );


  targetSheet.views =
    JSON.parse(
      JSON.stringify(
        sourceSheet.views || []
      )
    );


  if(sourceSheet.headerFooter){

    targetSheet.headerFooter =
      JSON.parse(
        JSON.stringify(
          sourceSheet.headerFooter
        )
      );

  }


  /* -------------------------------------------------------
     COLUMN WIDTH
  ------------------------------------------------------- */

  sourceSheet.columns.forEach(
    (sourceColumn, index) => {

      const targetColumn =
        targetSheet.getColumn(
          index + 1
        );

      targetColumn.width =
        sourceColumn.width;

      targetColumn.hidden =
        sourceColumn.hidden;

      targetColumn.outlineLevel =
        sourceColumn.outlineLevel;

      targetColumn.style =
        sourceColumn.style;

    }
  );


  /* -------------------------------------------------------
     ROW HEIGHT / HIDDEN
  ------------------------------------------------------- */

  sourceSheet.eachRow(
    {
      includeEmpty: true
    },
    (
      sourceRow,
      rowNumber
    ) => {

      const targetRow =
        targetSheet.getRow(
          rowNumber
        );

      targetRow.height =
        sourceRow.height;

      targetRow.hidden =
        sourceRow.hidden;

      targetRow.outlineLevel =
        sourceRow.outlineLevel;

      targetRow.collapsed =
        sourceRow.collapsed;

    }
  );


  /* -------------------------------------------------------
     CELL CONTENT + STYLE
  ------------------------------------------------------- */

  sourceSheet.eachRow(
    {
      includeEmpty: true
    },
    (
      sourceRow,
      rowNumber
    ) => {

      sourceRow.eachCell(
        {
          includeEmpty: true
        },
        (
          sourceCell,
          columnNumber
        ) => {

          const targetCell =
            targetSheet.getCell(
              rowNumber,
              columnNumber
            );


          /* VALUE */

          if(
            sourceCell.value !==
            undefined
          ){

            targetCell.value =
              sourceCell.value;

          }


          /* STYLE */

          if(sourceCell.style){

            targetCell.style =
              JSON.parse(
                JSON.stringify(
                  sourceCell.style
                )
              );

          }


          /* NUMBER FORMAT */

          if(
            sourceCell.numFmt
          ){

            targetCell.numFmt =
              sourceCell.numFmt;

          }


          /* FONT */

          if(
            sourceCell.font
          ){

            targetCell.font =
              JSON.parse(
                JSON.stringify(
                  sourceCell.font
                )
              );

          }


          /* FILL */

          if(
            sourceCell.fill
          ){

            targetCell.fill =
              JSON.parse(
                JSON.stringify(
                  sourceCell.fill
                )
              );

          }


          /* BORDER */

          if(
            sourceCell.border
          ){

            targetCell.border =
              JSON.parse(
                JSON.stringify(
                  sourceCell.border
                )
              );

          }


          /* ALIGNMENT */

          if(
            sourceCell.alignment
          ){

            targetCell.alignment =
              JSON.parse(
                JSON.stringify(
                  sourceCell.alignment
                )
              );

          }


          /* PROTECTION */

          if(
            sourceCell.protection
          ){

            targetCell.protection =
              JSON.parse(
                JSON.stringify(
                  sourceCell.protection
                )
              );

          }

        }
      );

    }
  );


  /* -------------------------------------------------------
     MERGED CELLS
  ------------------------------------------------------- */

  if(
    Array.isArray(
      sourceSheet.model?.merges
    )
  ){

    sourceSheet.model.merges.forEach(
      mergeRange => {

        try{

          targetSheet.mergeCells(
            mergeRange
          );

        }catch(error){

          console.warn(
            'Merge template dilewati:',
            mergeRange,
            error
          );

        }

      }
    );

  }


  return targetSheet;

}


/* =========================================================
   AMBIL DATA RAPOR SATU MURID
========================================================= */

async function raporExcelGetStudentData(student){

  const st =
    window.raporState || {};

  const academicYear =
    st.academic_year || '';

  const semester =
    st.semester || '';


  if(!student){
    throw new Error(
      'Data murid tidak ditemukan.'
    );
  }

  if(!academicYear){
    throw new Error(
      'Tahun ajaran belum dipilih.'
    );
  }

  if(!semester){
    throw new Error(
      'Semester belum dipilih.'
    );
  }


  /* =====================================================
     ASSESSMENT
  ===================================================== */

  const {
    data: assessment,
    error: assessmentError
  } =
    await sb
      .from('tahfidz_assessments')
      .select('*')
      .eq(
        'student_id',
        student.id
      )
      .eq(
        'academic_year',
        academicYear
      )
      .eq(
        'semester',
        semester
      )
      .maybeSingle();


  if(assessmentError){
    throw assessmentError;
  }


  /* =====================================================
     DETAIL HAFALAN
  ===================================================== */

  const {
    data: memos,
    error: memoError
  } =
    await sb
      .from('tahfidz_memorizations')
      .select('*')
      .eq(
        'student_id',
        student.id
      )
      .eq(
        'academic_year',
        academicYear
      )
      .eq(
        'semester',
        semester
      )
      .order(
        'id',
        {
          ascending: true
        }
      );


  if(memoError){
    throw memoError;
  }

  /* =====================================================
     SAMAKAN URUTAN DENGAN DETAIL HAFALAN
     
     Urutan:
     1. Juz
     2. Urutan surat berdasarkan RAPOR_SURAH_LIST
  ===================================================== */

  const sortedMemos =
    (memos || [])
      .slice()
      .sort(
        (a,b) => {

          const juzA =
            Number(
              a.juz || 0
            );

          const juzB =
            Number(
              b.juz || 0
            );


          /*
           * Urutan pertama: Juz
           */

          if(
            juzA !== juzB
          ){

            return juzA -
              juzB;

          }


          /*
           * Urutan kedua:
           * urutan surat Al-Qur'an
           */

          const surahA =
            RAPOR_SURAH_LIST.indexOf(
              String(
                a.surah || ''
              ).trim()
            );

          const surahB =
            RAPOR_SURAH_LIST.indexOf(
              String(
                b.surah || ''
              ).trim()
            );


          /*
           * Surat yang tidak ada
           * di daftar diletakkan paling belakang.
           */

          const orderA =
            surahA === -1
              ? 999
              : surahA;

          const orderB =
            surahB === -1
              ? 999
              : surahB;


          return orderA -
            orderB;

        }
      );
  /* =====================================================
     KELAS
  ===================================================== */

  const cls =
    cache.classes.find(
      x =>
        x.id ===
        student.class_id
    ) || null;


  /* =====================================================
     HALAQOH
  ===================================================== */

  const hal =
    cache.halaqoh.find(
      x =>
        x.id ===
        student.halaqoh_id
    ) || null;


  /* =====================================================
     NILAI
  ===================================================== */

const safeMemos =
  sortedMemos;

  const rataHafalan =
    typeof calcRaporHafalanAverage === 'function'
      ? calcRaporHafalanAverage(
          safeMemos
        )
      : null;


  const nilaiSas =
    typeof calcRaporSas === 'function'
      ? calcRaporSas(
          assessment?.tajwid,
          assessment?.kelancaran
        )
      : null;


  const nilaiHarian =
    typeof calcRaporHarian === 'function'
      ? calcRaporHarian(
          assessment?.sikap,
          assessment?.nilai_target
        )
      : null;


  const nilaiAkhir =
    typeof calcRaporFinal === 'function'
      ? calcRaporFinal({
          rata_rata_hafalan:
            rataHafalan,

          nilai_sas:
            nilaiSas,

          nilai_harian:
            nilaiHarian
        })
      : null;


  /* =====================================================
     GURU
     Sumber:
     cache.profiles
     assessment.teacher_id
     profiles.nipy
  ===================================================== */

  const profiles =
    Array.isArray(cache?.profiles)
      ? cache.profiles
      : [];


  const teacher =
    assessment?.teacher_id
      ? (
          profiles.find(
            p =>
              p.id ===
              assessment.teacher_id
          ) || null
        )
      : null;


  /*
   * Jika assessment belum mempunyai teacher_id,
   * gunakan guru yang sedang login sebagai fallback.
   */
  const teacherFinal =
    teacher ||
    (
      current?.id
        ? (
            profiles.find(
              p =>
                p.id ===
                current.id
            ) || current
          )
        : null
    );


  const teacherName =
    teacherFinal?.nama ||
    '';


  const teacherNipy =
    teacherFinal?.nipy ||
    '';


  /* =====================================================
     TANGGAL TERBIT
  ===================================================== */

  const tanggalTerbit =
    typeof getRaporExportTanggalTerbit === 'function'
      ? getRaporExportTanggalTerbit()
      : (
          settings?.rapor_tanggal_terbit ||
          ''
        );


  /* =====================================================
     RETURN
  ===================================================== */

  return {

    student,

    cls,

    hal,

    assessment,

    memos:
      safeMemos,

    rataHafalan,

    nilaiSas,

    nilaiHarian,

    nilaiAkhir,

    teacher,

    teacherName,

    teacherNipy,

    academic_year:
      academicYear,

    semester,

    tanggalTerbit

  };

}


/* =========================================================
   ISI SHEET
========================================================= */

/* =========================================================
   ISI TEMPLATE RAPOR EXCEL
   Menggunakan template:
   ./rapor-template.xlsx

   CATATAN MERGED CELL:
   - C:E   -> tulis C
   - H:I   -> tulis H
   - I:J   -> sesuai struktur template, tulis I
   - J:K   -> tulis J
   - B45:I45  -> tulis J45 untuk nilai kanan
   - J45:K45  -> tulis J45
   - J46:K46  -> tulis J46

   Posisi yang digunakan:
   F4  = Nama Murid
   F5  = NIS/NISN
   F6  = Nama Sekolah
   F7  = Alamat Sekolah (tidak diubah)

   K4  = Kelas
   K5  = Halaqoh
   K6  = Semester
   K7  = Tahun Ajaran

   C12:C42 = Juz
   F12:F42 = Surah
   G12:G42 = Tajwid
   H12:H42 = Kelancaran
   J12:J42 = Rata-rata

   J43 = SAS/SAT
   G44 = Nilai Tajwid
   H44 = Nilai Kelancaran
   J44 = Nilai SAS/SAT
   J45 = Nilai Harian
   J46 = Nilai Akhir

   F48 = Catatan
   I51 = Tanggal Terbit

   H52 = Guru Tahfidz
   H57 = Nama Guru
   H58 = NIPY Guru

   G65 = Nama Kepala Sekolah
   G66 = NIPY Kepala Sekolah
========================================================= */

async function raporExcelFillSheet(sheet, data){

  /* =====================================================
     DATA DASAR
  ===================================================== */

  const student =
    data?.student || {};

  const assessment =
    data?.assessment || {};

  const memos =
    Array.isArray(data?.memos)
      ? data.memos
      : [];


  /* =====================================================
     IDENTITAS MURID
  ===================================================== */

  const studentName =
    student?.nama ||
    '';

  const studentNis =
    student?.nis ||
    student?.nisn ||
    '';

  const schoolName =
    settings?.institution_name ||
    '';


  /*
   * F4 = NAMA MURID
   *
   * Nama murid dibuat BOLD.
   */
  sheet.getCell('F4').value =
    raporExcelText(
      studentName
    );

/* =====================================================
   F4 = NAMA MURID
   BOLD
===================================================== */

const f4 =
  sheet.getCell('F4');

f4.value =
  raporExcelText(
    studentName
  );


/*
 * Pertahankan seluruh format template,
 * tetapi paksa BOLD.
 */
const f4Font =
  f4.font || {};

f4.font = {
  ...f4Font,
  bold: true
};


  /*
   * F5 = NIS / NISN
   */
  sheet.getCell('F5').value =
    raporExcelText(
      studentNis
    );


  /*
   * F6 = NAMA SEKOLAH
   */
  sheet.getCell('F6').value =
    raporExcelText(
      schoolName
    );


  /*
   * F7 JANGAN DIUBAH
   *
   * Alamat sekolah tidak otomatis
   * karena tidak ada sumber data alamat
   * yang digunakan oleh exporter.
   */


  /* =====================================================
     IDENTITAS RAPOR
  ===================================================== */

  const cls =
    data?.cls || {};

  const hal =
    data?.hal || {};

  const academicYear =
    data?.academic_year ||
    window.raporState?.academic_year ||
    '';

  const semester =
    data?.semester ||
    window.raporState?.semester ||
    '';


  /*
   * K4 = KELAS
   */
  sheet.getCell('K4').value =
    raporExcelText(
      cls?.nama ||
      ''
    );


  /*
   * K5 = HALAQOH
   */
  sheet.getCell('K5').value =
    raporExcelText(
      hal?.nama ||
      ''
    );


  /*
   * K6 = SEMESTER
   */
  sheet.getCell('K6').value =
    raporExcelText(
      semester
    );


  /*
   * K7 = TAHUN AJARAN
   */
  sheet.getCell('K7').value =
    raporExcelText(
      academicYear
    );


  /* =====================================================
     DETAIL HAFALAN
  ===================================================== */

  /*
   * Template memiliki 31 baris:
   * 12 sampai 42
   */

  for(let i = 0; i < 31; i++){

    const row =
      12 + i;

    const memo =
      memos[i];


    /*
     * NOMOR
     *
     * B12:B42 tetap mengikuti template.
     * Tidak perlu ditulis ulang.
     */


    if(memo){

      /*
       * JUZ
       *
       * C:E merupakan merged cell.
       * Tulis hanya C.
       */
      sheet.getCell(
        `C${row}`
      ).value =
        raporExcelText(
          memo?.juz
        );


      /*
       * SURAH
       */
      sheet.getCell(
        `F${row}`
      ).value =
        raporExcelText(
          memo?.surah ||
          ''
        );


      /*
       * TAJWID
       */
      sheet.getCell(
        `G${row}`
      ).value =
        raporExcelNumber(
          memo?.tajwid
        );


      /*
       * KELANCARAN
       *
       * H:I merupakan merged cell.
       * Tulis hanya H.
       */
      sheet.getCell(
        `H${row}`
      ).value =
        raporExcelNumber(
          memo?.kelancaran
        );


      /*
       * RATA-RATA
       *
       * J:K merupakan merged cell.
       * Tulis hanya J.
       */
      sheet.getCell(
        `J${row}`
      ).value =
        raporExcelNumber(
          memo?.rata_rata
        );

    }else{

      /*
       * BARIS KOSONG
       *
       * Hanya cell yang kita isi
       * yang perlu dibersihkan.
       *
       * Jangan menghapus cell lain
       * karena merupakan bagian dari template.
       */

      sheet.getCell(
        `C${row}`
      ).value = null;

      sheet.getCell(
        `F${row}`
      ).value = null;

      sheet.getCell(
        `G${row}`
      ).value = null;

      sheet.getCell(
        `H${row}`
      ).value = null;

      sheet.getCell(
        `J${row}`
      ).value = null;

    }

  }


  /* =====================================================
     HITUNG NILAI
  ===================================================== */

  const rataHafalan =
    data?.rataHafalan ??
    (
      typeof calcRaporHafalanAverage === 'function'
        ? calcRaporHafalanAverage(
            memos
          )
        : null
    );


  const nilaiSas =
    data?.nilaiSas ??
    (
      typeof calcRaporSas === 'function'
        ? calcRaporSas(
            assessment?.tajwid,
            assessment?.kelancaran
          )
        : null
    );


  const nilaiHarian =
    data?.nilaiHarian ??
    (
      typeof calcRaporHarian === 'function'
        ? calcRaporHarian(
            assessment?.sikap,
            assessment?.nilai_target
          )
        : null
    );


  const nilaiAkhir =
    data?.nilaiAkhir ??
    (
      typeof calcRaporFinal === 'function'
        ? calcRaporFinal({
            rata_rata_hafalan:
              rataHafalan,

            nilai_sas:
              nilaiSas,

            nilai_harian:
              nilaiHarian
          })
        : null
    );


  /* =====================================================
     SAS / SAT
  ===================================================== */

  const jenisUjian =
    assessment?.jenis_ujian ||
    'SAS';


  /*
   * J43 = SAS / SAT
   *
   * J43:K43 merged.
   * Tulis hanya J43.
   */
  sheet.getCell('J43').value =
    raporExcelText(
      jenisUjian
    );


  /*
   * G44 = NILAI TAJWID
   */
  sheet.getCell('G44').value =
    raporExcelNumber(
      assessment?.tajwid
    );


  /*
   * H44 = NILAI KELANCARAN
   *
   * H:I merged.
   */
  sheet.getCell('H44').value =
    raporExcelNumber(
      assessment?.kelancaran
    );


  /*
   * J44 = NILAI SAS / SAT
   *
   * J:K merged.
   */
  sheet.getCell('J44').value =
    raporExcelNumber(
      nilaiSas
    );


  /* =====================================================
     NILAI HARIAN
  ===================================================== */

  /*
   * J45 = NILAI HARIAN
   */
  sheet.getCell('J45').value =
    raporExcelNumber(
      nilaiHarian
    );


  /* =====================================================
     NILAI AKHIR
  ===================================================== */

  /*
   * J46 = NILAI AKHIR
   */
  sheet.getCell('J46').value =
    raporExcelNumber(
      nilaiAkhir
    );


  /* =====================================================
     CATATAN GURU
  ===================================================== */

  /*
   * F48 = CATATAN
   *
   * Cell area catatan merupakan merged cell.
   * Tulis pada F48.
   */
  sheet.getCell('F48').value =
    raporExcelText(
      assessment?.catatan ||
      ''
    );


  /* =====================================================
     TANGGAL TERBIT
  ===================================================== */

  const tanggalTerbit =
    data?.tanggalTerbit ||
    (
      typeof getRaporExportTanggalTerbit === 'function'
        ? getRaporExportTanggalTerbit()
        : settings?.rapor_tanggal_terbit ||
          ''
    );


  const tanggalText =
    raporExcelFormatDate(
      tanggalTerbit
    );


  /*
   * I51 = TANGGAL TERBIT
   *
   * Hanya bagian tanggal dinamis
   * yang diisi.
   *
   * Tulisan statis template tetap dipertahankan.
   */
  sheet.getCell('I51').value =
    raporExcelText(
      tanggalText
    );


  /* =====================================================
     GURU TAHFIDZ
  ===================================================== */

  const teacherName =
    data?.teacherName ||
    '';

/* =====================================================
   TANDA TANGAN
===================================================== */


/* =====================================================
   H52 = GURU TAHFIDZ
   BOLD
===================================================== */

const h52 =
  sheet.getCell('H52');

h52.value =
  'Guru Tahfidz';

h52.font = {
  ...(h52.font || {}),
  bold: true
};


/* =====================================================
   H57 = NAMA GURU
   BOLD
===================================================== */

const h57 =
  sheet.getCell('H57');

h57.value =
  raporExcelText(
    data?.teacherName ||
    data?.teacher?.nama ||
    ''
  );

h57.font = {
  ...(h57.font || {}),
  bold: true
};


/* =====================================================
   H58 = NIPY GURU
   TIDAK BOLD
===================================================== */

const h58 =
  sheet.getCell('H58');

const teacherNipy =
  data?.teacherNipy ||
  data?.teacher?.nipy ||
  '';

h58.value =
  teacherNipy
    ? `NIPY. ${teacherNipy}`
    : 'NIPY. -';

h58.font = {
  ...(h58.font || {}),
  bold: false
};


/* =====================================================
   G65 = NAMA KEPALA SEKOLAH
   BOLD
===================================================== */

const g65 =
  sheet.getCell('G65');

const headmasterName =
  settings?.headmaster_name ||
  settings?.kepala_sekolah_nama ||
  '';

g65.value =
  raporExcelText(
    headmasterName
  );

g65.font = {
  ...(g65.font || {}),
  bold: true
};


/* =====================================================
   G66 = NIPY KEPALA SEKOLAH
   TIDAK BOLD
===================================================== */

const g66 =
  sheet.getCell('G66');

const headmasterNipy =
  settings?.headmaster_nipy ||
  settings?.headmaster_nip ||
  settings?.kepala_sekolah_nip ||
  '';

g66.value =
  headmasterNipy
    ? `NIPY. ${headmasterNipy}`
    : 'NIPY. -';

g66.font = {
  ...(g66.font || {}),
  bold: false
};
  /* =====================================================
     GRIDLINES
  ===================================================== */

  /*
   * Jangan mengubah style/template lainnya.
   * Hanya fallback apabila template belum
   * menentukan pengaturan gridlines.
   */

  if(
    sheet.views &&
    sheet.views.length
  ){

    sheet.views[0].showGridLines =
      false;

  }

}


/* =========================================================
   EXPORT SATU MURID
========================================================= */

async function exportRaporExcel(){

  try{

    const st =
      window.raporState || {};

    if(!st.student_id){

      return toast(
        'Silakan pilih murid terlebih dahulu.',
        'err'
      );

    }


    const students =
      typeof getRaporAllowedStudents ===
      'function'
        ? getRaporAllowedStudents()
        : (
            typeof getRaporStudentsForExport ===
            'function'
              ? getRaporStudentsForExport()
              : []
          );


    const student =
      students.find(
        x =>
          x.id ===
          st.student_id
      );


    if(!student){

      return toast(
        'Murid tidak ditemukan atau tidak termasuk hak akses Anda.',
        'err'
      );

    }


    const {
      workbook,
      sheet: templateSheet
    } =
      await raporExcelLoadTemplate();


    const data =
      await raporExcelGetStudentData(
        student
      );


    raporExcelFillSheet(
      templateSheet,
      data
    );


    /* -------------------------------------------------------
       Nama sheet
    ------------------------------------------------------- */

    const usedNames =
      new Set();

    templateSheet.name =
      raporExcelSafeSheetName(
        student.nama,
        usedNames
      );


    /* -------------------------------------------------------
       Download
    ------------------------------------------------------- */

    const buffer =
      await workbook.xlsx.writeBuffer();


    const blob =
      new Blob(
        [buffer],
        {
          type:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const a =
      document.createElement(
        'a'
      );

    a.href =
      url;

    a.download =
      `Rapor Tahfidz - ${student.nama || 'Murid'}.xlsx`;

    document.body.appendChild(a);

    a.click();

    a.remove();


    setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      2000
    );


    toast(
      'Rapor berhasil diexport.'
    );

  }catch(error){

    console.error(
      'exportRaporExcel error:',
      error
    );

    toast(
      `Gagal export rapor: ${
        error?.message || error
      }`,
      'err'
    );

  }

}


/* =========================================================
   EXPORT SEMUA HALAQOH
   ---------------------------------------------------------
   1 FILE XLSX
   1 SHEET = 1 MURID
========================================================= */

async function exportRaporExcelHalaqoh(){

  try{

    const st =
      window.raporState || {};


    if(!st.academic_year){

      return toast(
        'Tahun ajaran belum dipilih.',
        'err'
      );

    }


    if(!st.semester){

      return toast(
        'Semester belum dipilih.',
        'err'
      );

    }


    let students = [];


    if(
      typeof getRaporAllowedStudents ===
      'function'
    ){

      students =
        getRaporAllowedStudents();

    }else if(
      typeof getRaporStudentsForExport ===
      'function'
    ){

      students =
        getRaporStudentsForExport();

    }else{

      students =
        Array.isArray(
          cache?.students
        )
          ? cache.students.filter(
              s =>
                s.aktif !== false
            )
          : [];

    }


    if(!students.length){

      return toast(
        'Tidak ada murid yang dapat diexport.',
        'err'
      );

    }


    const {
      workbook,
      sheet: templateSheet
    } =
      await raporExcelLoadTemplate();


    const usedNames =
      new Set();


    /* -------------------------------------------------------
       SHEET PERTAMA
       -------------------------------------------------------
       Template asli langsung dipakai sebagai murid pertama.
    ------------------------------------------------------- */

    const firstStudent =
      students[0];


    const firstData =
      await raporExcelGetStudentData(
        firstStudent
      );


    raporExcelFillSheet(
      templateSheet,
      firstData
    );


    templateSheet.name =
      raporExcelSafeSheetName(
        firstStudent.nama,
        usedNames
      );


    /* -------------------------------------------------------
       SHEET BERIKUTNYA
    ------------------------------------------------------- */

    for(
      let index = 1;
      index < students.length;
      index++
    ){

      const student =
        students[index];


      const data =
        await raporExcelGetStudentData(
          student
        );


      const newSheet =
        raporExcelCopyWorksheet(
          workbook,
          templateSheet,
          raporExcelSafeSheetName(
            student.nama,
            usedNames
          )
        );


      /* ---------------------------------------------------
         Karena templateSheet sudah berisi murid pertama,
         kita harus mengembalikan sheet baru menjadi
         template kosong sebelum mengisi murid berikutnya.

         Cara paling aman:
         load template baru khusus untuk setiap student.
      --------------------------------------------------- */

      const {
        workbook: singleWorkbook,
        sheet: cleanTemplate
      } =
        await raporExcelLoadTemplate();


      raporExcelFillSheet(
        cleanTemplate,
        data
      );


      /* ---------------------------------------------------
         Copy isi cleanTemplate ke newSheet
      --------------------------------------------------- */

      cleanTemplate.eachRow(
        {
          includeEmpty: true
        },
        (
          sourceRow,
          rowNumber
        ) => {

          sourceRow.eachCell(
            {
              includeEmpty: true
            },
            (
              sourceCell,
              columnNumber
            ) => {

              newSheet.getCell(
                rowNumber,
                columnNumber
              ).value =
                sourceCell.value;

            }
          );

        }
      );


      /* ---------------------------------------------------
         Hapus workbook sementara
      --------------------------------------------------- */

      singleWorkbook.removeWorksheet(
        cleanTemplate.id
      );

    }


    /* -------------------------------------------------------
       DOWNLOAD
    ------------------------------------------------------- */

    const buffer =
      await workbook.xlsx.writeBuffer();


    const blob =
      new Blob(
        [buffer],
        {
          type:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const halaqohNames =
      [
        ...new Set(
          students
            .map(
              student =>
                cache.halaqoh.find(
                  h =>
                    h.id ===
                    student.halaqoh_id
                )?.nama
            )
            .filter(Boolean)
        )
      ];


    const halaqohLabel =
      halaqohNames.length === 1
        ? halaqohNames[0]
        : 'Semua Halaqoh';


    const safeLabel =
      String(
        halaqohLabel
      )
        .replace(
          /[\\\/\?\*\[\]\:]/g,
          ''
        )
        .trim() ||
      'Semua Halaqoh';


    const safeYear =
      String(
        st.academic_year
      )
        .replace(
          /[\\\/\?\*\[\]\:]/g,
          '_'
        );


    const fileName =
      `Rapor Tahfidz - ${safeLabel} - ` +
      `${st.semester} ${safeYear}.xlsx`;


    const a =
      document.createElement(
        'a'
      );

    a.href =
      url;

    a.download =
      fileName;

    document.body.appendChild(a);

    a.click();

    a.remove();


    setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      2000
    );


    toast(
      `Berhasil export ${students.length} rapor.`
    );


  }catch(error){

    console.error(
      'exportRaporExcelHalaqoh error:',
      error
    );

    toast(
      `Gagal export semua rapor: ${
        error?.message || error
      }`,
      'err'
    );

  }

}

function makeSafeExcelSheetName(name, index){

  let value =
    String(name || `Murid ${index}`)
      .replace(/[\\\/\?\*\[\]\:]/g, '')
      .trim();

  if(!value){
    value = `Murid ${index}`;
  }

  /*
   * Maksimal 31 karakter.
   */
  value =
    value.substring(0,31);

  return value;
}

function bindRapor(){

  if($('raporStudent')){

    $('raporStudent').onchange = () => {

      window.raporState = {

        ...(window.raporState || {}),

        student_id:
          $('raporStudent').value,

        academic_year:
          $('raporYear').value,

        semester:
          $('raporSemester').value

      };

    };

  }

}


function loadRaporData(){

  const student_id =
    $('raporStudent')?.value;

  const academic_year =
    $('raporYear')?.value.trim();

  const semester =
    $('raporSemester')?.value;


  if(!student_id){

    return toast(
      'Silakan pilih murid terlebih dahulu',
      'err'
    );

  }


  if(!academic_year){

    return toast(
      'Tahun ajaran wajib diisi',
      'err'
    );

  }


  window.raporState = {

    student_id,
    academic_year,
    semester

  };


  go('rapor');

}


function getCurrentRapor(){

  const st =
    window.raporState || {};


  if(!st.student_id){

    return null;

  }


  return cache.assessments.find(x =>

    x.student_id === st.student_id &&

    x.academic_year === st.academic_year &&

    x.semester === st.semester

  ) || null;

}


function getCurrentMemorizations(){

  const st =
    window.raporState || {};

  if(!st.student_id){

    return [];

  }

  return cache.memorizations

    .filter(x =>

      x.student_id === st.student_id &&

      x.academic_year === st.academic_year &&

      x.semester === st.semester

    )

    .sort((a,b) => {

      const juzA =
        Number(a.juz || 0);

      const juzB =
        Number(b.juz || 0);

      // Urutkan berdasarkan Juz terlebih dahulu
      if(juzA !== juzB){

        return juzA - juzB;

      }

      // Jika Juz sama,
      // ikuti urutan surat yang sudah digunakan aplikasi
      const surahA =
        RAPOR_SURAH_LIST.indexOf(
          String(a.surah || '').trim()
        );

      const surahB =
        RAPOR_SURAH_LIST.indexOf(
          String(b.surah || '').trim()
        );

      // Surat yang tidak ditemukan diletakkan paling belakang
      const orderA =
        surahA === -1 ? 999 : surahA;

      const orderB =
        surahB === -1 ? 999 : surahB;

      return orderA - orderB;

    });

}


function renderRaporWorkspace(){

  const st =
    window.raporState || {};


  const student =
    cache.students.find(
      x => x.id === st.student_id
    );


  if(!student){

    return `
      <div class="bg-white rounded-2xl p-6">
        Murid tidak ditemukan.
      </div>
    `;

  }


  const assessment =
    getCurrentRapor();


  const memos =
    getCurrentMemorizations();


  const cls =
    cache.classes.find(
      x => x.id === student.class_id
    );


  const hal =
    cache.halaqoh.find(
      x => x.id === student.halaqoh_id
    );


  const n = x =>

    x === null ||
    x === undefined ||
    x === ''

      ? '-'

      : Number(x).toFixed(0);


const rataHafalan =
  calcRaporHafalanAverage(memos);

const nilaiSas =
  calcRaporSas(
    assessment?.tajwid,
    assessment?.kelancaran
  );

const nilaiHarian =
  calcRaporHarian(
    assessment?.sikap,
    assessment?.nilai_target
  );

const nilaiAkhir =
  calcRaporFinal({
    rata_rata_hafalan: rataHafalan,
    nilai_sas: nilaiSas,
    nilai_harian: nilaiHarian
  });


  return `

    <div class="space-y-5">


      <!-- HEADER RAPOR -->

      <div
        class="
          bg-white
          rounded-2xl
          p-5
          shadow-sm
          border
          border-slate-100">

        <div
          class="
            flex
            flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-3">

          <div>

            <h3
              class="
                text-xl
                font-bold
                text-slate-800">

              Rapor Tahfidz —
              ${esc(student.nama)}

            </h3>

            <p
              class="text-sm text-slate-500">

              ${esc(cls?.nama || '-')}
              •
              ${esc(hal?.nama || '-')}
              •
              ${esc(st.semester)}
              •
              ${esc(st.academic_year)}

            </p>

          </div>


<div class="flex gap-2 flex-wrap">

  <button
    onclick="openRaporAssessment()"
    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
    ${assessment ? '✏️ Edit Nilai' : '➕ Isi Nilai'}
  </button>

  <button
    onclick="openRaporMemorization()"
    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
    ➕ Tambah Hafalan
  </button>

<button
    onclick="openRaporImportExcel()"
    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
    📥 Import Excel
  </button>

<button
  onclick="exportRaporExcel()"
  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
  📊 Export Excel
</button>
<button
  onclick="exportRaporExcelHalaqoh()"
  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
  📚 Export Semua Halaqoh
</button>
</div>


        <!-- NILAI RINGKAS -->

        <div
          class="
            grid
            grid-cols-2
            md:grid-cols-4
            gap-3
            mt-5">

          <div
            class="
              p-4
              rounded-xl
              bg-slate-50">

            <div
              class="text-xs text-slate-500">

              Tajwid

            </div>

            <div
              class="text-2xl font-bold">

              ${n(assessment?.tajwid)}

            </div>

          </div>


          <div
            class="
              p-4
              rounded-xl
              bg-slate-50">

            <div
              class="text-xs text-slate-500">

              Kelancaran

            </div>

            <div
              class="text-2xl font-bold">

              ${n(assessment?.kelancaran)}

            </div>

          </div>


          <div
            class="
              p-4
              rounded-xl
              bg-slate-50">

            <div
              class="text-xs text-slate-500">

              Nilai Ujian

            </div>

            <div
              class="text-2xl font-bold">

              ${n(nilaiSas)}

            </div>

          </div>


          <div
            class="
              p-4
              rounded-xl
              bg-emerald-50">

            <div
              class="text-xs text-slate-500">

              Nilai Akhir

            </div>

            <div
              class="
                text-2xl
                font-bold
                text-emerald-700">

              ${n(nilaiAkhir)}

            </div>

          </div>

        </div>

      </div>


      <!-- DETAIL HAFALAN -->

      <div
        class="
          bg-white
          rounded-2xl
          p-5
          shadow-sm
          border
          border-slate-100">

        <div
          class="
            flex
            items-center
            justify-between
            mb-4">

          <div>

            <b class="text-lg">

              Detail Hafalan

            </b>

            <p
              class="
                text-xs
                text-slate-500">

              Juz, nama surat, tajwid,
              kelancaran, dan rata-rata.

            </p>

          </div>


          <span
            class="
              text-sm
              text-slate-500">

            ${memos.length} surat

          </span>

        </div>


        <div class="overflow-x-auto">

          <table
            class="w-full text-sm">

            <thead>

              <tr
                class="bg-slate-50">

                <th class="p-3 text-left">
                  No
                </th>

                <th class="p-3 text-left">
                  Juz
                </th>

                <th class="p-3 text-left">
                  Nama Surat
                </th>

                <th class="p-3 text-left">
                  Tajwid
                </th>

                <th class="p-3 text-left">
                  Kelancaran
                </th>

                <th class="p-3 text-left">
                  Rata-rata
                </th>

                <th class="p-3 text-left">
                  Aksi
                </th>

              </tr>

            </thead>


            <tbody>

              ${
                memos.length

                ?

                memos.map((m,i) => `

                  <tr
                    class="
                      border-t
                      hover:bg-slate-50">

                    <td class="p-3">
                      ${i+1}
                    </td>

                    <td class="p-3">
                      ${esc(m.juz ?? '-')}
                    </td>

                    <td class="p-3">
                      ${esc(m.surah || '-')}
                    </td>

                    <td class="p-3">
                      ${n(m.tajwid)}
                    </td>

                    <td class="p-3">
                      ${n(m.kelancaran)}
                    </td>

                    <td
                      class="
                        p-3
                        font-semibold">

                      ${n(m.rata_rata)}

                    </td>

                    <td
                      class="
                        p-3
                        whitespace-nowrap">

                      <button
                        onclick="
                          openRaporMemorization(
                            '${m.id}'
                          )
                        "
                        class="
                          text-blue-600
                          hover:underline
                          mr-3">

                        ✏️ Edit

                      </button>

                      <button
                        onclick="
                          deleteRaporMemorization(
                            '${m.id}'
                          )
                        "
                        class="
                          text-red-600
                          hover:underline">

                        🗑️ Hapus

                      </button>

                    </td>

                  </tr>

                `).join('')

                :

                `

                  <tr>

                    <td
                      colspan="7"
                      class="
                        p-7
                        text-center
                        text-slate-500">

                      Belum ada detail hafalan
                      untuk semester ini.

                    </td>

                  </tr>

                `

              }

            </tbody>

          </table>

        </div>

      </div>


      <!-- CATATAN -->

      <div
        class="
          bg-white
          rounded-2xl
          p-5
          shadow-sm
          border
          border-slate-100">

        <div
          class="
            flex
            items-center
            justify-between
            mb-3">

          <b class="text-lg">
            Catatan Semester
          </b>

        </div>

        <p
          class="
            text-sm
            text-slate-600
            whitespace-pre-line">

          ${esc(
            assessment?.catatan ||
            'Belum ada catatan guru.'
          )}

        </p>

      </div>

    </div>

  `;

}
function previewRapor(){

  try{

    const st = window.raporState || {};

    if(!st.student_id){
      return toast(
        'Murid belum dipilih',
        'err'
      );
    }
if(!getRaporTanggalTerbit()){
  return toast(
    'Tanggal terbit rapor belum diatur oleh Koordinator',
    'err'
  );
}

    if(
      typeof isRaporStudentAllowed === 'function' &&
      !isRaporStudentAllowed(st.student_id)
    ){
      return toast(
        'Anda tidak memiliki akses ke murid ini',
        'err'
      );
    }


    const student =
      Array.isArray(cache?.students)
        ? cache.students.find(
            x => x.id === st.student_id
          )
        : null;
const teacher =
  getCurrentTeacherProfile();

const nipyGuru =
  getCurrentTeacherNipy();

    if(!student){
      return toast(
        'Data murid tidak ditemukan',
        'err'
      );
    }


    const assessment =
      typeof getCurrentRapor === 'function'
        ? getCurrentRapor()
        : null;


    const memos =
      typeof getCurrentMemorizations === 'function'
        ? getCurrentMemorizations()
        : [];


    const cls =
      Array.isArray(cache?.classes)
        ? cache.classes.find(
            x => x.id === student.class_id
          )
        : null;


    const hal =
      Array.isArray(cache?.halaqoh)
        ? cache.halaqoh.find(
            x => x.id === student.halaqoh_id
          )
        : null;


    const rataHafalan =
      typeof calcRaporHafalanAverage === 'function'
        ? calcRaporHafalanAverage(memos)
        : null;


    const nilaiSas =
      typeof calcRaporSas === 'function'
        ? calcRaporSas(
            assessment?.tajwid,
            assessment?.kelancaran
          )
        : null;


    const nilaiHarian =
      typeof calcRaporHarian === 'function'
        ? calcRaporHarian(
            assessment?.sikap,
            assessment?.nilai_target
          )
        : null;


    const nilaiAkhir =
      typeof calcRaporFinal === 'function'
        ? calcRaporFinal({
            rata_rata_hafalan: rataHafalan,
            nilai_sas: nilaiSas,
            nilai_harian: nilaiHarian
          })
        : null;


    renderRaporPreview({

      student,

      cls,

      hal,

      assessment,

      memos,

      rataHafalan,

      nilaiSas,

      nilaiHarian,

      nilaiAkhir,

      academic_year:
        st.academic_year,

      semester:
        st.semester,

        teacher,
nipyGuru,

    });


  }catch(error){

    console.error(
      'ERROR previewRapor:',
      error
    );

    toast(
      'Preview rapor gagal. Cek Console browser.',
      'err'
    );

  }

}


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

  const selectedCoordinatorClass =
    current.role === 'koordinator'
      ? (window.coordinatorReportClassFilter || '')
      : '';


  const rows = cache.reports.filter(
    r => {

      const allowedByRole =
        current.role === 'koordinator' ||
        r.teacher_id === current.id;


      const allowedByClass =
        current.role !== 'koordinator' ||
        !selectedCoordinatorClass ||
        r.class_id === selectedCoordinatorClass;


      return (
        allowedByRole &&
        allowedByClass
      );

    }
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

<div class="flex gap-2 flex-wrap">
  ${
    current.role === 'koordinator'
    ? `
      <select
        onchange="filterCoordinatorReportClass(this.value)"
        class="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">

        <option value="">
          Semua Kelas
        </option>

        ${
          cache.classes
            .map(c => `
              <option
                value="${c.id}"
                ${
                  (
                    window.coordinatorReportClassFilter ||
                    ''
                  ) === c.id
                    ? 'selected'
                    : ''
                }
              >
                ${esc(c.nama)}
              </option>
            `)
            .join('')
        }

      </select>
    `
    : ''
  }
  <button
    onclick="previewQuarterlyReports()"
    class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
    📋 Preview
  </button>

  <button
    onclick="exportQuarterlyReportsExcel()"
    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
    📊 Export Excel
  </button>

  <button

    onclick="openReport()"
    class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg">
    + Isi Rekap
  </button>
  

</div>

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

function exportQuarterlyReportsExcel(){

  if(typeof XLSX === 'undefined'){
    return toast(
      'Library Excel belum tersedia',
      'err'
    );
  }

  let reports = cache.reports.filter(
    r =>
      current.role === 'koordinator' ||
      r.teacher_id === current.id
  );

  if(!reports.length){
    return toast(
      'Belum ada data rekap 3 bulan untuk diekspor',
      'err'
    );
  }

  /*
    KOORDINATOR:
    ekspor berdasarkan seluruh kelas master.

    GURU:
    hanya kelas yang menjadi penugasannya.
  */

  const classes =
    current.role === 'koordinator'
      ? cache.classes
      : cache.classes.filter(c =>
          cache.teacherClass.some(
            tc =>
              tc.teacher_id === current.id &&
              tc.class_id === c.id
          )
        );

  if(!classes.length){
    return toast(
      'Tidak ada kelas yang dapat diekspor',
      'err'
    );
  }

  const workbook = XLSX.utils.book_new();

  classes.forEach(cls => {

    const classReports = reports.filter(
      r => r.class_id === cls.id
    );

    /*
      Tetap buat sheet kelas walaupun
      belum ada rekap.
    */

    const data = classReports.map(r => {

      const student = cache.students.find(
        s => s.id === r.student_id
      );

      const j1 = cache.journals.find(
        j => j.id === r.month1_journal_id
      );

      const j2 = cache.journals.find(
        j => j.id === r.month2_journal_id
      );

      const j3 = cache.journals.find(
        j => j.id === r.month3_journal_id
      );

      return {
        'Periode': r.period_start || '',
        'Nama Murid': student?.nama || '',
        'NIS': student?.nis || '',
        'Kelas': cls.nama || '',
        'Bulan 1': j1?.hafalan || '',
        'Bulan 2': j2?.hafalan || '',
        'Bulan 3': j3?.hafalan || '',
        'Persentase': Number(r.persentase || 0),
        'Catatan': r.catatan || ''
      };

    });

    /*
      Jika belum ada data,
      tetap tampilkan header.
    */

    const worksheet = XLSX.utils.json_to_sheet(
      data.length
        ? data
        : [{
            'Periode': '',
            'Nama Murid': '',
            'NIS': '',
            'Kelas': cls.nama || '',
            'Bulan 1': '',
            'Bulan 2': '',
            'Bulan 3': '',
            'Persentase': '',
            'Catatan': ''
          }]
    );

    /*
      Lebar kolom agar file Excel
      langsung nyaman dibaca.
    */

    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 28 },
      { wch: 15 },
      { wch: 20 },
      { wch: 30 },
      { wch: 30 },
      { wch: 30 },
      { wch: 14 },
      { wch: 40 }
    ];

    /*
      Nama sheet Excel maksimal 31 karakter
      dan tidak boleh mengandung karakter tertentu.
    */

    let sheetName = String(
      cls.nama || 'Kelas'
    )
      .replace(/[\\\/\?\*\[\]\:]/g, '')
      .substring(0, 31)
      .trim();

    if(!sheetName){
      sheetName = 'Kelas';
    }

    /*
      Hindari nama sheet duplikat.
    */

    let originalName = sheetName;
    let counter = 2;

    while(workbook.SheetNames.includes(sheetName)){

      const suffix = ` (${counter})`;

      sheetName =
        originalName
          .substring(0, 31 - suffix.length) +
        suffix;

      counter++;
    }

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheetName
    );

  });

  XLSX.writeFile(
    workbook,
    'Rekap_3_Bulan.xlsx'
  );

  toast(
    'Rekap 3 bulan berhasil diekspor ke Excel'
  );
}
function filterCoordinatorReportClass(classId){

  window.coordinatorReportClassFilter =
    classId || '';

  go('report');

}
function previewQuarterlyReports(){

  let reports = cache.reports.filter(
    r =>
      current.role === 'koordinator' ||
      r.teacher_id === current.id
  );

  if(!reports.length){
    return toast(
      'Belum ada data rekap 3 bulan',
      'err'
    );
  }

  const classes =
    current.role === 'koordinator'
      ? cache.classes
      : cache.classes.filter(c =>
          cache.teacherClass.some(
            tc =>
              tc.teacher_id === current.id &&
              tc.class_id === c.id
          )
        );

  if(!classes.length){
    return toast(
      'Tidak ada kelas yang dapat ditampilkan',
      'err'
    );
  }

  const classOptions = classes.map(c => `
    <option value="${c.id}">
      ${esc(c.nama)}
    </option>
  `).join('');

  const firstClassId = classes[0].id;

  const html = `
    <div class="bg-white rounded-2xl p-5 shadow-sm">

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">

        <div>
          <b class="text-lg">
            📋 Preview Rekap 3 Bulan
          </b>

          <p class="text-xs text-slate-500">
            Periksa data sebelum diekspor ke Excel.
          </p>
        </div>

        <div class="flex gap-2 flex-wrap">

          <button
  onclick="closeQuarterlyPreview()"
  class="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg">
  ← Kembali
</button>

          <button
            onclick="exportQuarterlyReportsExcel()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            📊 Export Excel
          </button>

        </div>

      </div>

      <div class="mb-5">

        <label class="block text-sm font-semibold mb-2">
          Pilih Kelas
        </label>

        <select
          id="previewReportClass"
          onchange="renderQuarterlyPreview(this.value)"
          class="w-full md:w-80 border rounded-lg px-3 py-2">

          ${classOptions}

        </select>

      </div>

      <div id="quarterlyPreviewContent"></div>

    </div>
  `;

  const content = $('content');

if(!content){
  return toast(
    'Area aplikasi tidak ditemukan',
    'err'
  );
}

content.innerHTML = html;

  renderQuarterlyPreview(firstClassId);
}
function closeQuarterlyPreview(){
  go('report');
}
function renderQuarterlyPreview(classId){

  const container = $('quarterlyPreviewContent');

  if(!container) return;

  const reports = cache.reports.filter(
    r =>
      r.class_id === classId &&
      (
        current.role === 'koordinator' ||
        r.teacher_id === current.id
      )
  );

  const cls = cache.classes.find(
    c => c.id === classId
  );

  if(!reports.length){

    container.innerHTML = `
      <div class="p-6 text-center text-slate-500 bg-slate-50 rounded-xl">
        Belum ada data rekap 3 bulan untuk
        <b>${esc(cls?.nama || '-')}</b>.
      </div>
    `;

    return;
  }

  const rows = reports.map(r => {

    const student = cache.students.find(
      s => s.id === r.student_id
    );

    const j1 = cache.journals.find(
      j => j.id === r.month1_journal_id
    );

    const j2 = cache.journals.find(
      j => j.id === r.month2_journal_id
    );

    const j3 = cache.journals.find(
      j => j.id === r.month3_journal_id
    );

    return `
      <tr class="border-t hover:bg-slate-50">

        <td class="p-3">
          ${esc(student?.nama || '-')}
        </td>

        <td class="p-3">
          ${esc(student?.nis || '-')}
        </td>

        <td class="p-3">
          ${esc(r.period_start || '-')}
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

        <td class="p-3 text-center font-semibold">
          ${r.persentase ?? 0}%
        </td>

        <td class="p-3">
          ${esc(r.catatan || '-')}
        </td>

      </tr>
    `;

  }).join('');

  container.innerHTML = `

    <div class="mb-3">

      <h3 class="font-bold text-base">
        ${esc(cls?.nama || '-')}
      </h3>

      <p class="text-xs text-slate-500">
        ${reports.length} data rekap
      </p>

    </div>

    <div class="overflow-x-auto border rounded-xl">

      <table class="w-full text-sm">

        <thead>

          <tr class="bg-slate-50">

            <th class="p-3 text-left">
              Nama Murid
            </th>

            <th class="p-3 text-left">
              NIS
            </th>

            <th class="p-3 text-left">
              Periode
            </th>

            <th class="p-3 text-left">
              Bulan 1
            </th>

            <th class="p-3 text-left">
              Bulan 2
            </th>

            <th class="p-3 text-left">
              Bulan 3
            </th>

            <th class="p-3 text-center">
              Persentase
            </th>

            <th class="p-3 text-left">
              Catatan
            </th>

          </tr>

        </thead>

        <tbody>

          ${rows}

        </tbody>

      </table>

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
    x =>
      current.role === 'koordinator' ||
      x.teacher_id === current.id
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

                const eligible =
                  x.status === 'Lulus' &&
                  (
                    x.predikat === 'Mumtaz' ||
                    x.predikat === 'Jayyid Jiddan'
                  );

                const alreadyRequested =
                  Array.isArray(cache.certificates) &&
                  cache.certificates.some(
                    c => c.exam_request_id === x.id
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

                      ${
                        eligible && !alreadyRequested
                        ?
                        `
                          <button
                            onclick="requestCertificate('${x.id}')"
                            class="text-purple-700 hover:underline mr-3">
                            📜 Ajukan Sertifikat
                          </button>
                        `
                        :
                        ''
                      }

                      ${
                        alreadyRequested
                        ?
                        `
                          <span class="text-slate-500 mr-3">
                            📜 Sertifikat Diajukan
                          </span>
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
async function requestCertificate(examId){

  const examData =
    cache.exams.find(
      x => x.id === examId
    );

  if(!examData){
    return toast(
      'Data ujian tidak ditemukan',
      'err'
    );
  }

  if(
    examData.status !== 'Lulus' ||
!['Mumtaz Murtafi\'','Mumtaz','Jayyid Jiddan'].includes(examData.predikat)
    )
  {
    return toast(
      'Ujian belum memenuhi syarat penerbitan sertifikat',
      'err'
    );
  }

  const alreadyRequested =
    Array.isArray(cache.certificates) &&
    cache.certificates.some(
      x => x.exam_request_id === examId
    );

  if(alreadyRequested){
    return toast(
      'Sertifikat untuk ujian ini sudah diajukan',
      'err'
    );
  }

  const payload = {

    exam_request_id:
      examData.id,

    student_id:
      examData.student_id,

    requested_by:
      current.id,

    status:
      'pending'

  };

  const { data, error } =
    await sb
      .from('certificate_requests')
      .insert(payload)
      .select()
      .single();

  if(error){

    console.error(error);

    return toast(
      error.message,
      'err'
    );

  }

  if(!Array.isArray(cache.certificates)){
    cache.certificates = [];
  }

  cache.certificates.push(data);

  toast(
    'Pengajuan sertifikat berhasil dikirim'
  );

  go('exam');
}
function certificate(){

  const rows =
    Array.isArray(cache.certificates)
      ? cache.certificates.filter(
          x =>
            current.role === 'koordinator' ||
            x.requested_by === current.id
        )
      : [];

  return `
    <div class="bg-white rounded-2xl p-5 shadow-sm">

      <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">

        <div>
          <b class="text-lg">
            Sertifikat Kenaikan Juz
          </b>

          <p class="text-xs text-slate-500">
            Pengajuan dan penerbitan sertifikat kenaikan juz.
          </p>
        </div>

      </div>

      <div class="overflow-x-auto">

        <table class="w-full text-sm">

          <thead>
            <tr class="bg-slate-50">

              <th class="p-3 text-left">
                Murid
              </th>

              <th class="p-3 text-left">
                Juz
              </th>

              <th class="p-3 text-left">
                Tanggal Ujian
              </th>

              <th class="p-3 text-left">
                Predikat
              </th>

<th class="p-3 text-left">
  Status Sertifikat
</th>

<th class="p-3 text-left">
  Tanggal Diterbitkan
</th>

<th class="p-3 text-left">
  Aksi
</th>

            </tr>
          </thead>

          <tbody>

            ${
              rows.length
              ?
              rows.map(x => {

                const examData =
                  cache.exams.find(
                    e =>
                      e.id === x.exam_request_id
                  );

                const student =
                  cache.students.find(
                    s =>
                      s.id === x.student_id
                  );

                return `
                  <tr class="border-t hover:bg-slate-50">

                    <td class="p-3">
                      ${esc(
                        student?.nama || '-'
                      )}
                    </td>

                    <td class="p-3">
                      ${esc(
                        examData?.juz || '-'
                      )}
                    </td>

                    <td class="p-3">
                      ${esc(
                        examData?.tanggal || '-'
                      )}
                    </td>

                    <td class="p-3">
                      ${esc(
                        examData?.predikat || '-'
                      )}
                    </td>

                    <td class="p-3">

                      ${
                        x.status === 'issued'
                        ?
                        `
                          <span class="text-emerald-600 font-medium">
                            Diterbitkan
                          </span>
                        `
                        :
                        x.status === 'rejected'
                        ?
                        `
                          <span class="text-red-600 font-medium">
                            Ditolak
                          </span>
                        `
                        :
                        `
                          <span class="text-amber-600 font-medium">
                            Menunggu Penerbitan
                          </span>
                        `
                      }

                    </td>
<td class="p-3">
  ${
    x.issued_at
    ?
    new Date(x.issued_at).toLocaleDateString(
      'id-ID',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    )
    :
    '-'
  }
</td>
                    <td class="p-3 whitespace-nowrap">

${
  current.role === 'koordinator' &&
  x.status === 'pending'
  ?
  `
    <button
      onclick="issueCertificate('${x.id}')"
      class="text-emerald-700 hover:underline mr-3">
      📜 Terbitkan
    </button>

    <button
      onclick="rejectCertificate('${x.id}')"
      class="text-red-600 hover:underline">
      ✖ Tolak
    </button>
  `
  :
  ''
}

${
  x.status === 'issued'
  ?
  `
    <button
      onclick="printCertificate('${x.id}')"
      class="text-blue-700 hover:underline mr-3">
      🖨️ Cetak Sertifikat
    </button>
  `
  :
  ''
}

<button
  onclick="deleteCertificate('${x.id}')"
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

                    Belum ada pengajuan sertifikat.

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
async function deleteCertificate(id){

  const request =
    cache.certificates.find(
      x => x.id === id
    );

  if(!request){
    return toast(
      'Data sertifikat tidak ditemukan',
      'err'
    );
  }


  const confirmed =
    confirm(
      'Apakah Anda yakin ingin menghapus sertifikat ini?'
    );

  if(!confirmed){
    return;
  }


  const { error } =
    await sb
      .from('certificate_requests')
      .delete()
      .eq('id', id);


  if(error){

    console.error(error);

    return toast(
      error.message,
      'err'
    );

  }


  cache.certificates =
    cache.certificates.filter(
      x => x.id !== id
    );


  toast(
    'Sertifikat berhasil dihapus'
  );


  go('certificate');

}
function printCertificate(id){

  const request =
    cache.certificates.find(x => x.id === id);

  if(!request){
    return toast('Data sertifikat tidak ditemukan','err');
  }

  if(request.status !== 'issued'){
    return toast('Sertifikat belum diterbitkan','err');
  }

  const examData =
    cache.exams.find(
      x => x.id === request.exam_request_id
    );

  if(!examData){
    return toast('Data ujian tidak ditemukan','err');
  }

  const student =
    cache.students.find(
      s => s.id === request.student_id
    );

  if(!student){
    return toast('Data murid tidak ditemukan','err');
  }

  if(!settings.certificate_background_url){
    return toast(
      'Background sertifikat belum diatur di Peraturan & Pengaturan',
      'err'
    );
  }


  /* =====================================================
     DATA SERTIFIKAT
  ===================================================== */

  const juzRaw =
    String(examData.juz || '');

  const juzMatch =
    juzRaw.match(/\d+/);

  const juzNumber =
    juzMatch
      ? juzMatch[0]
      : (juzRaw || '-');


  /* =====================================================
     NOMOR SERTIFIKAT
  ===================================================== */

  const certificateNumber =
    '027/SDITQ ABA/UJIAN KELULUSAN JUZ/2026';


  /* =====================================================
     PREDIKAT
  ===================================================== */

/* =====================================================
   PREDIKAT
===================================================== */

const predicate =
  examData.predikat || '-';

let arabicPredicate =
  predicate;

if(predicate === "Mumtaz Murtafi'"){
  arabicPredicate = 'ممتاز مرتفع';
}

if(predicate === 'Mumtaz'){
  arabicPredicate = 'ممتاز';
}

if(predicate === 'Jayyid Jiddan'){
  arabicPredicate = 'جيد جدا';
}

if(predicate === 'Jayyid'){
  arabicPredicate = 'جيد';
}
  /* =====================================================
     DATA TANDA TANGAN
  ===================================================== */

  const headmasterName =
    settings.headmaster_name ||
    'Adetya Nur Fajar, S.Pd., Gr';

  const headmasterNip =
    settings.headmaster_nip ||
    '02221234';

  const coordinatorName =
    settings.tahfidz_coordinator_name ||
    'Saprudin';

  const coordinatorNip =
    settings.tahfidz_coordinator_nip ||
    '02220404';


  /* =====================================================
     BACKGROUND
  ===================================================== */

  const background =
    settings.certificate_background_url;


  /* =====================================================
     WINDOW CETAK
  ===================================================== */

  const win =
    window.open('', '_blank');

  if(!win){
    return toast(
      'Popup diblokir browser. Silakan izinkan popup.',
      'err'
    );
  }


  win.document.write(`

<!DOCTYPE html>

<html lang="id">

<head>

<meta charset="UTF-8">

<title>Sertifikat Kelulusan Juz</title>


<!-- =================================================
     FONT
================================================= -->

<link
  rel="preconnect"
  href="https://fonts.googleapis.com"
>

<link
  rel="preconnect"
  href="https://fonts.gstatic.com"
  crossorigin
>

<link
  href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Open+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Reem+Kufi:wght@400;500;600;700&display=swap"
  rel="stylesheet"
>


<style>

/* =====================================================
   A4 LANDSCAPE
===================================================== */

@page{

  size:A4 landscape;

  margin:0;

}


*{

  box-sizing:border-box;

}


html,
body{

  margin:0;

  padding:0;

  width:100%;

  height:100%;

}


body{

  background:#fff;

  color:#000;

}


/* =====================================================
   HALAMAN SERTIFIKAT
===================================================== */

.certificate{

  position:relative;

  width:297mm;

  height:210mm;

  overflow:hidden;

  background-image:url("${background}");

  background-size:100% 100%;

  background-position:center;

  background-repeat:no-repeat;

}


/* =====================================================
   KONTEN UTAMA
===================================================== */

.content{

  position:absolute;

  z-index:10;

  top:30mm;

  left:50%;

  transform:translateX(-50%);

  width:196mm;

  text-align:center;

}


/* =====================================================
   BISMILLAH
===================================================== */

.bismillah{

  font-family:
    "Amiri",
    "Traditional Arabic",
    serif;

  font-size:36px;

  font-weight:400;

  color:#a0712e;

  line-height:1;

  margin-bottom:6mm;

  direction:rtl;

  text-align:center;

}


/* =====================================================
   JUDUL ARAB
===================================================== */

.title-arabic{
  font-family:
    "Reem Kufi",
    sans-serif;
  font-optical-sizing:auto;
  font-size:53px;
  font-weight:500;
  font-style:normal;
  color:#a0712e;
  line-height:1.15;
  direction:rtl;
  text-align:center;
  margin:0;
}


/* =====================================================
   NOMOR SERTIFIKAT
===================================================== */

.certificate-number{

  margin-top:4mm;

  font-family:
    "Kitsch Display",
    Georgia,
    serif;

  font-size:21px;

  font-weight:500;

  color:#000;

  text-align:center;

  line-height:1.2;

}


/* =====================================================
   INTRO
===================================================== */

.intro{

  margin-top:6mm;

  font-family:
    Garet,
    "Open Sans",
    Arial,
    sans-serif;

  font-size:19.5px;

  font-weight:400;

  color:#000;

  text-align:center;

  line-height:1.35;

}


/* =====================================================
   NAMA MURID
===================================================== */

.student-name{

  display:table;

  margin:3mm auto 0;

  padding:
    0
    10mm
    1.8mm;

  font-family:
    "Open Sans",
    Arial,
    sans-serif;

  font-size:36px;

  font-weight:700;

  text-transform:uppercase;

  color:#a0712e;

  line-height:1.05;

  text-align:center;

  border-bottom:
    1.7px solid #a0712e;

}

/* =====================================================
   LULUS
===================================================== */

.lulus-text{

  margin-top:4mm;

  font-family:
    Garet,
    "Open Sans",
    Arial,
    sans-serif;

  font-size:19px;

  font-weight:400;

  color:#000;

  line-height:1.35;

  text-align:center;

}


/* =====================================================
   PREDIKAT LABEL
===================================================== */

.predicate-label{

  margin-top:2mm;

  font-family:
    Garet,
    "Open Sans",
    Arial,
    sans-serif;

  font-size:19px;

  font-weight:400;

  color:#000;

  text-align:center;

}


/* =====================================================
   PREDIKAT ARAB
===================================================== */

.predicate-arabic{

  margin-top:1.5mm;

  font-family:
    "Playfair Display",
    "Amiri",
    serif;

  font-size:33px;

  font-weight:700;

  color:#a0712e;

  line-height:1.15;

  direction:rtl;

  text-align:center;

}


/* =====================================================
   UCAPAN SELAMAT
===================================================== */

.congratulations{

  width:185mm;

  margin:5mm auto 0;

  font-family:
    Garet,
    "Open Sans",
    Arial,
    sans-serif;

  font-size:19px;

  font-weight:400;

  color:#000;

  line-height:1.4;

  text-align:center;

}


/* =====================================================
   MABRUK VERTIKAL
===================================================== */

.mabruk-vertical{

  position:absolute;

  z-index:12;

  right:30mm;

  bottom:50mm;

  writing-mode:vertical-rl;

  transform:rotate(180deg);

  font-family:
    "UKIJ Diwani",
    "Amiri",
    "Traditional Arabic",
    serif;

  font-size:27px;

  color:#000;

  opacity:0.5;

  direction:rtl;

  white-space:nowrap;

}

/* =====================================================
   TEKS JUZ DI ATAS MEDALI BACKGROUND

   MEDALI DAN PITA SUDAH ADA DI BACKGROUND.
   TIDAK ADA MEDALI YANG DIGAMBAR OLEH CSS.
===================================================== */

.medal-text{

  position:absolute;

  z-index:30;

  /*
    Diturunkan dari posisi sebelumnya
    agar lebih masuk ke area badge.
  */

  top:45mm;

  right:21mm;

  width:51mm;

  text-align:center;

  color:#fff;

  font-family:
    "Playfair Display",
    Georgia,
    serif;

  text-shadow:
    1px 1px 2px #6d4300,
    0 0 2px rgba(0,0,0,.35);

}


/* =====================================================
   TULISAN JUZ
===================================================== */

.medal-label{

  position:relative;

  font-size:30px;

  font-weight:700;

  line-height:1;

}


/* =====================================================
   NOMOR JUZ
===================================================== */

.medal-number{

  position:relative;

  margin-top:2mm;

  font-size:54px;

  font-weight:700;

  line-height:.95;

}


/* =====================================================
   TANDA TANGAN
===================================================== */

.signatures{

  position:absolute;

  z-index:15;

  left:39mm;

  right:15mm;

  bottom:11mm;

  display:grid;

  grid-template-columns:1fr 1fr;

  column-gap:45mm;

  align-items:start;

}


/* =====================================================
   BLOK TANDA TANGAN
===================================================== */

.signature{

  width:78mm;

  text-align:left;

  font-family:
    "Open Sans",
    Arial,
    sans-serif;

  font-size:19px;

  color:#000;

}


/* =====================================================
   KEPALA SEKOLAH + KOORDINATOR
===================================================== */

.signature-heading{

  min-height:10mm;

  font-size:18px;

  font-weight:700;

  line-height:1.35;

}


/*
  Mengetahui berada di atas jabatan kepala sekolah.

  Koordinator diberi jarak atas yang sama
  agar posisinya sejajar dengan:
  "Kepala SDITQ Abu Bakr Ash-Shiddiq"
*/

.signature:nth-child(2) .signature-heading{

  padding-top:4.7mm;

}


.signature-heading > div{

  white-space:nowrap;

}


/* =====================================================
   RUANG TANDA TANGAN
===================================================== */

.signature-space{

  height:15mm;

}


/* =====================================================
   NAMA PENANDATANGAN
===================================================== */

.signature-name{

  display:inline-block;

  font-size:18px;

  font-weight:700;

  line-height:1.2;

  padding-bottom:1mm;

  border-bottom:
    1px solid #000;

}


/* =====================================================
   NIPY
===================================================== */

.signature-nip{

  margin-top:1mm;

  font-size:16px;

  line-height:1.2;

}


/* =====================================================
   PRINT
===================================================== */

@media print{

  html,
  body{

    width:297mm;

    height:210mm;

  }


  .certificate{

    width:297mm;

    height:210mm;

    page-break-after:always;

    -webkit-print-color-adjust:exact !important;

    print-color-adjust:exact !important;

  }

}

</style>

</head>


<body>


<div class="certificate">


  <!-- =================================================
       KONTEN UTAMA
  ================================================== -->

  <div class="content">


    <!-- BISMILLAH -->

    <div class="bismillah">

      ﷽

    </div>


    <!-- JUDUL ARAB -->

    <div class="title-arabic">

      شهادة إتمام الجزء

    </div>


    <!-- NOMOR -->

    <div class="certificate-number">

      Nomor: ${esc(certificateNumber)}

    </div>


    <!-- DENGAN BANGGA -->

    <div class="intro">

      Dengan bangga diberikan kepada:

    </div>


    <!-- NAMA MURID -->

    <div class="student-name">

      ${esc(student.nama)}

    </div>


    <!-- LULUS -->

    <div class="lulus-text">

      Telah dinyatakan lulus ujian hafalan Juz ${esc(juzNumber)}

    </div>


    <!-- PREDIKAT -->

    <div class="predicate-label">

      Dengan predikat

    </div>


    <div class="predicate-arabic">

      ${esc(arabicPredicate)}

    </div>


    <!-- UCAPAN -->

    <div class="congratulations">

      Selamat atas kelulusan hafalan juz Al-Qur'an Ananda.
      Semoga Allah memberkahi dan menjadikan generasi
      Qurani yang berakhlak mulia.

    </div>


  </div>



  <!-- =================================================
       MABRUK
  ================================================== -->

  <div class="mabruk-vertical">

    مَبْرُوكٌ عَلَى حِفْظِ الْقُرْآنِ

  </div>



  <!-- =================================================
       JUZ DI ATAS MEDALI BACKGROUND

       MEDALI + PITA TIDAK DIBUAT DI SINI.
       HANYA TEKS JUZ DINAMIS.
  ================================================== -->

  <div class="medal-text">

    <div class="medal-label">

      JUZ

    </div>

    <div class="medal-number">

      ${esc(juzNumber)}

    </div>

  </div>



  <!-- =================================================
       TANDA TANGAN
  ================================================== -->

  <div class="signatures">


    <!-- =================================================
         KEPALA SEKOLAH
    ================================================== -->

    <div class="signature">

      <div class="signature-heading">

        <div>
          Mengetahui,
        </div>

        <div>
          Kepala SDITQ Abu Bakr Ash-Shiddiq
        </div>

      </div>


      <div class="signature-space"></div>


      <div class="signature-name">

        ${esc(headmasterName)}

      </div>


      <div class="signature-nip">

        NIPY. ${esc(headmasterNip)}

      </div>

    </div>



    <!-- =================================================
         KOORDINATOR TAHFIDZ
    ================================================== -->

    <div class="signature">

      <div class="signature-heading">

        <div>
          Koordinator Tahfidz
        </div>

      </div>


      <div class="signature-space"></div>


      <div class="signature-name">

        ${esc(coordinatorName)}

      </div>


      <div class="signature-nip">

        NIPY. ${esc(coordinatorNip)}

      </div>

    </div>


  </div>


</div>


<script>

window.onload = function(){

  setTimeout(function(){

    window.print();

  },1000);

};

<\/script>


</body>

</html>

  `);

  win.document.close();

}
async function issueCertificate(id){

  const request = cache.certificates.find(x => x.id === id);

  if(!request){
    return toast('Pengajuan sertifikat tidak ditemukan','err');
  }

  if(request.status !== 'pending'){
    return toast('Sertifikat ini sudah diproses','err');
  }

  const examData =
    cache.exams.find(x => x.id === request.exam_request_id);

  if(!examData){
    return toast('Data ujian tidak ditemukan','err');
  }

  const student =
    cache.students.find(x => x.id === request.student_id);

  if(!student){
    return toast('Data murid tidak ditemukan','err');
  }

  const year = new Date().getFullYear();

  const existingNumbers =
    cache.certificates
      .map(x => x.certificate_number)
      .filter(Boolean);

  const number =
    String(existingNumbers.length + 1).padStart(3,'0');

const certificate_number =
  '027/SDITQ ABA/UJIAN KELULUSAN JUZ/2026';

  const payload = {
    status: 'issued',
    certificate_number,
    issued_by: current.id,
    issued_at: new Date().toISOString()
  };

  const { data, error } =
    await sb
      .from('certificate_requests')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

  if(error){
    console.error(error);
    return toast(error.message,'err');
  }

  const index =
    cache.certificates.findIndex(x => x.id === id);

  if(index !== -1){
    cache.certificates[index] = data;
  }

  toast('Sertifikat berhasil diterbitkan');

  go('certificate');
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


  /*
   * Halaqoh yang diampu guru
   */
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


  /*
   * Untuk Koordinator:
   * semua murid aktif bisa dipilih.
   *
   * Untuk Guru:
   * hanya murid yang memiliki halaqoh
   * yang memang diampu guru tersebut.
   */
  let students =
    cache.students.filter(
      s => s.aktif
    );


  if(current.role !== 'koordinator'){

    const halaqohIds =
      halaqoh.map(
        h => h.id
      );


    students =
      students.filter(
        s =>
          halaqohIds.includes(
            s.halaqoh_id
          )
      );

  }


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


  /*
   * Guru hanya boleh mengajukan murid
   * dari halaqoh yang dia ampu.
   */
  if(current.role !== 'koordinator'){

    const allowedHalaqoh =
      cache.teacherHalaqoh
        .filter(
          x =>
            x.teacher_id === current.id
        )
        .map(
          x => x.halaqoh_id
        );


    if(
      !allowedHalaqoh.includes(
        halaqoh_id
      )
    ){

      return toast(
        'Anda hanya dapat mengajukan ujian untuk halaqoh yang Anda ampu',
        'err'
      );

    }


    /*
     * Pastikan murid yang dipilih
     * memang berada pada halaqoh tersebut.
     */
    const student =
      cache.students.find(
        s =>
          s.id === student_id
      );


    if(!student){

      return toast(
        'Data murid tidak ditemukan',
        'err'
      );

    }


    if(
      student.halaqoh_id &&
      student.halaqoh_id !== halaqoh_id
    ){

      return toast(
        'Halaqoh murid tidak sesuai dengan halaqoh yang Anda ampu',
        'err'
      );

    }

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

<option value="Mumtaz Murtafi'">Mumtaz Murtafi'</option>
<option value="Mumtaz">Mumtaz</option>
<option value="Jayyid Jiddan">Jayyid Jiddan</option>
<option value="Jayyid">Jayyid</option>

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


  // Simpan hasil ujian
  const { data: examData, error } =
    await sb
      .from('exam_requests')
      .update(payload)
      .eq('id',id)
      .select()
      .single();


  if(error){

    console.error(error);

    return toast(
      error.message,
      'err'
    );

  }


  /*
   * Jika LULUS, Koordinator langsung
   * membuat dan menerbitkan sertifikat.
   */
  if(
    status === 'Lulus' &&
    current.role === 'koordinator'
  ){

    const eligiblePredikat = [
      "Mumtaz Murtafi'",
      'Mumtaz',
      'Jayyid Jiddan'
    ];


    if(
      eligiblePredikat.includes(predikat)
    ){

      // Cek apakah sertifikat sudah ada
      const alreadyRequested =
        Array.isArray(cache.certificates) &&
        cache.certificates.some(
          x => x.exam_request_id === id
        );


      if(!alreadyRequested){

        const certificatePayload = {

          exam_request_id:
            id,

          student_id:
            examData.student_id,

          requested_by:
            current.id,

          status:
            'pending'

        };


        const {
          data: certificateData,
          error: certificateError
        } =
          await sb
            .from('certificate_requests')
            .insert(certificatePayload)
            .select()
            .single();


        if(certificateError){

          console.error(
            certificateError
          );

          return toast(
            certificateError.message,
            'err'
          );

        }


        // Terbitkan langsung
        const year =
          new Date().getFullYear();

        const existingNumbers =
          Array.isArray(cache.certificates)
            ? cache.certificates
                .map(
                  x => x.certificate_number
                )
                .filter(Boolean)
            : [];


        const number =
          String(
            existingNumbers.length + 1
          ).padStart(3,'0');


        const certificate_number =
          '027/SDITQ ABA/UJIAN KELULUSAN JUZ/2026';


        const issuePayload = {

          status:
            'issued',

          certificate_number,

          issued_by:
            current.id,

          issued_at:
            new Date().toISOString()

        };


        const {
          data: issuedCertificate,
          error: issueError
        } =
          await sb
            .from('certificate_requests')
            .update(issuePayload)
            .eq(
              'id',
              certificateData.id
            )
            .select()
            .single();


        if(issueError){

          console.error(
            issueError
          );

          return toast(
            issueError.message,
            'err'
          );

        }


        // Update cache
        if(
          !Array.isArray(
            cache.certificates
          )
        ){

          cache.certificates = [];

        }


        cache.certificates.push(
          issuedCertificate
        );


        toast(
          'Ujian Lulus dan sertifikat berhasil diterbitkan'
        );

      }else{

        toast(
          'Ujian Lulus. Sertifikat sudah tersedia'
        );

      }

    }else{

      toast(
        'Ujian Lulus, tetapi predikat belum memenuhi syarat sertifikat'
      );

    }

  }else{

    toast(
      status === 'Lulus'
        ? 'Ujian dinyatakan Lulus'
        : 'Ujian dinyatakan Tidak Lulus'
    );

  }


  closeModal();

  await loadAll();

  go(
    status === 'Lulus' &&
    current.role === 'koordinator'
      ? 'certificate'
      : 'exam'
  );

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
<th class="p-3 text-left">NIPY</th>
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
  ${esc(g.nipy || '-')}
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
                    colspan="7"
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

  NIPY

  <input
    id="gnipy"
    type="text"
    value="${esc(g.nipy || '')}"
    placeholder="Masukkan NIPY guru"
    autocomplete="off"
    class="mt-1 w-full p-2.5 border rounded-lg">

  <p class="mt-1 text-xs text-slate-500">
    NIPY akan digunakan otomatis pada Rapor Tahfidz.
  </p>

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

  const nipy =
    $('gnipy').value.trim();


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


  // Update status dan NIPY guru

  const r =
    await sb
      .from('profiles')
      .update({
        status,
        nipy
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
function getCurrentTeacherProfile(){

  if(!current?.id){
    return null;
  }

  return (
    cache.profiles.find(
      p => p.id === current.id
    )
    || current
  );
}


function getCurrentTeacherNipy(){

  const teacher =
    getCurrentTeacherProfile();

  return teacher?.nipy || '';
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
function settingsPage(){

  return `
    <div class="space-y-6">

      <div class="bg-white rounded-2xl p-6 shadow-sm">

        <div class="flex items-start justify-between gap-4 mb-5">

          <div>
            <h3 class="font-bold text-lg">
              Identitas & Pengaturan
            </h3>

            <p class="text-sm text-slate-500">
              Pengaturan identitas lembaga, logo, tema, background beranda,
              dan template background sertifikat.
            </p>
          </div>

          <span class="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
            Khusus Koordinator
          </span>

        </div>


        <form
          onsubmit="saveSettings(event)"
          class="grid md:grid-cols-2 gap-4"
        >


          <!-- NAMA LEMBAGA -->

          <label class="block text-sm font-medium md:col-span-2">

            Nama lembaga

            <input
              id="setName"
              required
              value="${esc(settings.institution_name || '')}"
              class="mt-1 w-full p-3 border rounded-lg"
              placeholder="Contoh: SDITQ Abu Bakr Ash-Shiddiq">

          </label>


          <!-- LOGO LEMBAGA -->

          <label class="block text-sm font-medium">

            Logo lembaga

            <input
              id="setLogoFile"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              class="mt-1 w-full p-2.5 border rounded-lg">

            <span class="text-xs text-slate-500">
              Maksimal 500 KB.
            </span>

          </label>


          <!-- LOGO YAYASAN -->

          <label class="block text-sm font-medium">

            Logo yayasan

            <input
              id="setFoundationLogoFile"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onchange="previewFoundationLogo(this)"
              class="mt-1 w-full p-2.5 border rounded-lg">

            <span class="text-xs text-slate-500">
              Digunakan pada sertifikat. Maksimal 500 KB.
            </span>

          </label>


          <!-- TEMA -->

          <label class="block text-sm font-medium">

            Tema

            <select
              id="setTheme"
              class="mt-1 w-full p-3 border rounded-lg">

              <option
                value="emerald"
                ${settings.theme === 'emerald' ? 'selected' : ''}>
                Emerald
              </option>

              <option
                value="blue"
                ${settings.theme === 'blue' ? 'selected' : ''}>
                Biru
              </option>

              <option
                value="purple"
                ${settings.theme === 'purple' ? 'selected' : ''}>
                Ungu
              </option>

              <option
                value="amber"
                ${settings.theme === 'amber' ? 'selected' : ''}>
                Amber
              </option>

              <option
                value="rose"
                ${settings.theme === 'rose' ? 'selected' : ''}>
                Rose
              </option>

            </select>

          </label>
<!-- TANGGAL TERBIT RAPOR -->

<label class="block text-sm font-medium">

  Tanggal Terbit Rapor

  <input
    id="setRaporTanggalTerbit"
    type="date"
    value="${esc(settings.rapor_tanggal_terbit || '')}"
    class="mt-1 w-full p-3 border rounded-lg"
  >

  <span class="text-xs text-slate-500">
    Tanggal ini digunakan secara otomatis pada semua Rapor Tahfidz.
  </span>

</label>

          <!-- BACKGROUND BERANDA -->

          <label class="block text-sm font-medium">

            Background Beranda

            <input
              id="setBackgroundFile"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="mt-1 w-full p-2.5 border rounded-lg">

            <span class="text-xs text-slate-500">
              Maksimal 2 MB.
            </span>

          </label>


          <!-- BACKGROUND SERTIFIKAT -->

          <label class="block text-sm font-medium md:col-span-2">

            Background Sertifikat

            <input
              id="setCertificateBackgroundFile"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onchange="previewCertificateBackground(this)"
              class="mt-1 w-full p-2.5 border rounded-lg">

            <span class="text-xs text-slate-500">
              Gunakan gambar template sertifikat kosong.
              Maksimal 3 MB.
            </span>

          </label>


          <!-- PREVIEW -->

          <div class="md:col-span-2 grid md:grid-cols-3 gap-4">


            <!-- LOGO LEMBAGA -->

            <div>

              <div class="text-sm font-medium mb-2">
                Preview Logo Lembaga
              </div>

              <div
                class="w-28 h-28 border rounded-xl flex items-center justify-center overflow-hidden bg-slate-50">

                <img
                  id="logoPreview"
                  class="max-w-full max-h-full object-contain ${
                    settings.logo_url ? '' : 'hidden'
                  }"
                  src="${esc(settings.logo_url || '')}"
                  alt="Logo lembaga">

                <span
                  id="logoPreviewEmpty"
                  class="text-xs text-slate-400 ${
                    settings.logo_url ? 'hidden' : ''
                  }">
                  Logo lembaga
                </span>

              </div>

            </div>


            <!-- LOGO YAYASAN -->

            <div>

              <div class="text-sm font-medium mb-2">
                Preview Logo Yayasan
              </div>

              <div
                class="w-28 h-28 border rounded-xl flex items-center justify-center overflow-hidden bg-slate-50">

                <img
                  id="foundationLogoPreview"
                  class="max-w-full max-h-full object-contain ${
                    settings.foundation_logo_url ? '' : 'hidden'
                  }"
                  src="${esc(settings.foundation_logo_url || '')}"
                  alt="Logo yayasan">

                <span
                  id="foundationLogoPreviewEmpty"
                  class="text-xs text-slate-400 ${
                    settings.foundation_logo_url ? 'hidden' : ''
                  }">
                  Logo yayasan
                </span>

              </div>

            </div>


            <!-- BACKGROUND SERTIFIKAT -->

            <div>

              <div class="text-sm font-medium mb-2">
                Preview Sertifikat
              </div>

              <div
                class="relative aspect-[1.414/1] border rounded-xl overflow-hidden bg-slate-100">

                <img
                  id="certificateBackgroundPreview"
                  class="w-full h-full object-cover ${
                    settings.certificate_background_url ? '' : 'hidden'
                  }"
                  src="${esc(settings.certificate_background_url || '')}"
                  alt="Background sertifikat">

                <span
                  id="certificateBackgroundPreviewEmpty"
                  class="absolute inset-0 flex items-center justify-center text-xs text-slate-400 ${
                    settings.certificate_background_url ? 'hidden' : ''
                  }">
                  Belum ada background sertifikat
                </span>

              </div>

            </div>


          </div>


          <!-- BACKGROUND BERANDA PREVIEW -->

          <div class="md:col-span-2">

            <div class="text-sm font-medium mb-2">
              Preview Background Beranda
            </div>

            <div
              class="relative h-28 border rounded-xl overflow-hidden bg-slate-100">

              <img
                id="backgroundPreview"
                class="w-full h-full object-cover ${
                  settings.background_url ? '' : 'hidden'
                }"
                src="${esc(settings.background_url || '')}"
                alt="Background beranda">

              <span
                id="backgroundPreviewEmpty"
                class="absolute inset-0 flex items-center justify-center text-xs text-slate-400 ${
                  settings.background_url ? 'hidden' : ''
                }">
                Belum ada background
              </span>

            </div>

          </div>


          <!-- SIMPAN -->

          <button
            type="submit"
            class="md:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-semibold">

            Simpan Pengaturan

          </button>

        </form>

      </div>


      <!-- MASTER -->

      <div>

        <div class="flex items-center justify-between mb-3">

          <div>

            <h3 class="font-bold text-lg">
              Pengaturan Master
            </h3>

            <p class="text-sm text-slate-500">
              Kelas, halaqoh, dan penguji yang digunakan oleh menu lainnya.
            </p>

          </div>

        </div>

        ${masterCards()}

      </div>

    </div>
  `;
}
function bindSettings(){$('setTheme').value=settings.theme||'emerald';$('setLogoFile').addEventListener('change',async()=>{const f=$('setLogoFile').files?.[0];if(!f)return;if(f.size>500*1024){toast('Ukuran logo maksimal 500 KB','err');$('setLogoFile').value='';return}const u=await fileToDataUrl(f),img=$('logoPreview');img.src=u;img.classList.remove('hidden');$('logoPreviewEmpty').classList.add('hidden')})}
function fileToDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
async function saveSettings(e){

  e.preventDefault();


  let logo_url =
    settings.logo_url || '';

  let foundation_logo_url =
    settings.foundation_logo_url || '';

  let background_url =
    settings.background_url || '';

  let certificate_background_url =
    settings.certificate_background_url || '';


  const logoFile =
    $('setLogoFile')?.files?.[0];

  const foundationLogoFile =
    $('setFoundationLogoFile')?.files?.[0];

  const backgroundFile =
    $('setBackgroundFile')?.files?.[0];

  const certificateBackgroundFile =
    $('setCertificateBackgroundFile')?.files?.[0];


  /* LOGO LEMBAGA */

  if(logoFile){

    if(logoFile.size > 500 * 1024){

      return toast(
        'Ukuran logo lembaga maksimal 500 KB',
        'err'
      );

    }

    logo_url =
      await fileToDataUrl(logoFile);

  }


  /* LOGO YAYASAN */

  if(foundationLogoFile){

    if(foundationLogoFile.size > 500 * 1024){

      return toast(
        'Ukuran logo yayasan maksimal 500 KB',
        'err'
      );

    }

    foundation_logo_url =
      await fileToDataUrl(foundationLogoFile);

  }


  /* BACKGROUND BERANDA */

  if(backgroundFile){

    if(backgroundFile.size > 2 * 1024 * 1024){

      return toast(
        'Ukuran background beranda maksimal 2 MB',
        'err'
      );

    }

    background_url =
      await fileToDataUrl(backgroundFile);

  }


  /* BACKGROUND SERTIFIKAT */

  if(certificateBackgroundFile){

    if(certificateBackgroundFile.size > 3 * 1024 * 1024){

      return toast(
        'Ukuran background sertifikat maksimal 3 MB',
        'err'
      );

    }

    certificate_background_url =
      await fileToDataUrl(
        certificateBackgroundFile
      );

  }


  const next = {

    id: 1,

    institution_name:
      $('setName').value.trim(),

    logo_url,

    foundation_logo_url,

    background_url,

    certificate_background_url,

    theme:
      $('setTheme').value,
      rapor_tanggal_terbit:
  $('setRaporTanggalTerbit')?.value || null,

    updated_by:
      current.id,

    updated_at:
      new Date().toISOString()

  };


  const {
    data,
    error
  } =
    await sb
      .from('app_settings')
      .upsert(
        next,
        {
          onConflict:'id'
        }
      )
      .select()
      .single();


  if(error){

    console.error(error);

    return toast(
      error.message,
      'err'
    );

  }


  settings = {

    ...settings,

    ...data

  };


  applySettings();


  toast(
    'Pengaturan berhasil disimpan'
  );


  go('settings');

}
function previewFoundationLogo(input){

  const file =
    input?.files?.[0];

  if(!file){
    return;
  }


  if(file.size > 500 * 1024){

    input.value = '';

    return toast(
      'Ukuran logo yayasan maksimal 500 KB',
      'err'
    );

  }


  const reader =
    new FileReader();


  reader.onload = function(e){

    const img =
      $('foundationLogoPreview');

    const empty =
      $('foundationLogoPreviewEmpty');


    if(img){

      img.src =
        e.target.result;

      img.classList.remove('hidden');

    }


    if(empty){

      empty.classList.add('hidden');

    }

  };


  reader.readAsDataURL(file);

}
async function addMaster(e,table,input){e.preventDefault();const {error}=await sb.from(table).insert({nama:$(input).value.trim()});if(error)return toast(error.message,'err');toast('Data ditambahkan');await loadAll();go('settings')}
async function delMaster(table,id){if(!confirm('Hapus data ini?'))return;const {error}=await sb.from(table).delete().eq('id',id);if(error)return toast(error.message,'err');toast('Data dihapus');await loadAll();go('settings')}
function student(){

  const assignedClassIds = current.role === 'koordinator'
    ? []
    : cache.teacherClass
        .filter(x => x.teacher_id === current.id)
        .map(x => x.class_id);

  const assignedHalaqohIds = current.role === 'koordinator'
    ? []
    : cache.teacherHalaqoh
        .filter(x => x.teacher_id === current.id)
        .map(x => x.halaqoh_id);


  /* =====================================================
     FILTER KELAS KOORDINATOR
  ===================================================== */

  const selectedCoordinatorClass =
    current.role === 'koordinator'
      ? (window.coordinatorStudentClassFilter || '')
      : '';


  let visibleStudents = cache.students;


  if(
    current.role === 'koordinator' &&
    selectedCoordinatorClass
  ){

    visibleStudents =
      cache.students.filter(
        s =>
          s.class_id ===
          selectedCoordinatorClass
      );

  }

  return `
    <div class="bg-white rounded-2xl p-5 shadow-sm">

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">

        <div>
          <b class="text-lg">Data Murid</b>
          <p class="text-xs text-slate-500">
            Kelola data murid, kelas, halaqoh, dan status.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          ${
            current.role === 'koordinator'
            ? `
              <select
                onchange="filterCoordinatorStudentClass(this.value)"
                class="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">

                <option value="">
                  Semua Kelas
                </option>

                ${
                  cache.classes
                    .map(c => `
                      <option
                        value="${c.id}"
                        ${
                          (
                            window.coordinatorStudentClassFilter ||
                            ''
                          ) === c.id
                            ? 'selected'
                            : ''
                        }
                      >
                        ${esc(c.nama)}
                      </option>
                    `)
                    .join('')
                }

              </select>
            `
            : ''
          }
          ${
            current.role !== 'koordinator'
            ? `
              <select
                id="studentViewFilter"
                onchange="filterStudentView(this.value)"
                class="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">

                <option value="all">
                  Semua Penugasan
                </option>

                <option value="class">
                  📚 Kelas yang Diampu
                </option>

                <option value="halaqoh">
                  📖 Halaqoh yang Diampu
                </option>

              </select>
            `
            : ''
          }

          <button
            onclick="downloadStudentTemplate()"
            class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg">
            📄 Download Template Excel
          </button>

          <button
            onclick="openStudentImport()"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            📥 Impor dari Excel
          </button>

          <button
            onclick="openStudent()"
            class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg">
            + Tambah Murid
          </button>

        </div>
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

          <tbody id="studentTableBody">

            ${
              visibleStudents.length
              ?
              visibleStudents.map(s=>`
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
function filterCoordinatorStudentClass(classId){

  window.coordinatorStudentClassFilter =
    classId || '';

  go('student');

}

async function importStudentRows(){

  if(!window.studentImportRows || !window.studentImportRows.length){
    return toast('Tidak ada data yang akan diimpor','err');
  }

  const rows = window.studentImportRows;

  const normalize = value =>
    String(value || '')
      .trim()
      .toLowerCase();

  const assignedClassIds = current.role === 'koordinator'
    ? cache.classes.map(x => x.id)
    : cache.teacherClass
        .filter(x => x.teacher_id === current.id)
        .map(x => x.class_id);

  const assignedHalaqohIds = current.role === 'koordinator'
    ? cache.halaqoh.map(x => x.id)
    : cache.teacherHalaqoh
        .filter(x => x.teacher_id === current.id)
        .map(x => x.halaqoh_id);

  const validRows = [];
  const invalidRows = [];

  rows.forEach((row, index) => {

    const nama = String(row.nama || '').trim();
    const nis = String(row.nis || '').trim() || null;
    const kelas = String(row.kelas || '').trim();
    const halaqoh = String(row.halaqoh || '').trim();

    if(!nama){
      invalidRows.push(
        `Baris ${index + 2}: Nama murid kosong`
      );
      return;
    }

    const classData = cache.classes.find(x =>
      normalize(x.nama) === normalize(kelas)
    );

    if(kelas && !classData){
      invalidRows.push(
        `Baris ${index + 2}: Kelas "${kelas}" tidak ditemukan`
      );
      return;
    }

    const halaqohData = cache.halaqoh.find(x =>
      normalize(x.nama) === normalize(halaqoh)
    );

    if(halaqoh && !halaqohData){
      invalidRows.push(
        `Baris ${index + 2}: Halaqoh "${halaqoh}" tidak ditemukan`
      );
      return;
    }

    /*
      ATURAN PENUGASAN GURU:

      1. Jika guru ditugaskan pada kelas tersebut,
         maka guru boleh memasukkan murid ke kelas itu
         tanpa melihat halaqohnya.

      2. Jika kelas bukan penugasan guru, tetapi
         halaqoh tersebut memang penugasannya,
         maka tetap boleh.

      3. Jika tidak memenuhi keduanya, ditolak.
    */

    if(current.role !== 'koordinator'){

      const classAllowed =
        classData &&
        assignedClassIds.includes(classData.id);

      const halaqohAllowed =
        halaqohData &&
        assignedHalaqohIds.includes(halaqohData.id);

      if(!classAllowed && !halaqohAllowed){

        invalidRows.push(
          `Baris ${index + 2}: Kelas "${kelas}" dan Halaqoh "${halaqoh}" bukan penugasan Anda`
        );

        return;
      }
    }

    validRows.push({
      nama,
      nis,
      class_id: classData?.id || null,
      halaqoh_id: halaqohData?.id || null,
      aktif: true
    });

  });

  if(!validRows.length){

    return toast(
      'Tidak ada data valid yang dapat diimpor',
      'err'
    );

  }

  const result = await sb
    .from('students')
    .insert(validRows);

  if(result.error){
    return toast(result.error.message,'err');
  }

  await loadAll();

  toast(
    `${validRows.length} murid berhasil diimpor`
  );

  if(invalidRows.length){

    alert(
      `Impor selesai.\n\n` +
      `Berhasil: ${validRows.length} murid\n` +
      `Ditolak: ${invalidRows.length} baris\n\n` +
      invalidRows.join('\n')
    );

  }

  window.studentImportRows = [];

  go('student');
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
function filterStudentView(type){

  const assignedClassIds = current.role === 'koordinator'
    ? []
    : cache.teacherClass
        .filter(x => x.teacher_id === current.id)
        .map(x => x.class_id);

  const assignedHalaqohIds = current.role === 'koordinator'
    ? []
    : cache.teacherHalaqoh
        .filter(x => x.teacher_id === current.id)
        .map(x => x.halaqoh_id);

  let students = cache.students;

  if(current.role !== 'koordinator'){

    if(type === 'class'){
      students = cache.students.filter(s =>
        assignedClassIds.includes(s.class_id)
      );
    }

    else if(type === 'halaqoh'){
      students = cache.students.filter(s =>
        assignedHalaqohIds.includes(s.halaqoh_id)
      );
    }

    else {
      students = cache.students.filter(s =>
        assignedClassIds.includes(s.class_id) ||
        assignedHalaqohIds.includes(s.halaqoh_id)
      );
    }

  }

  const tbody = $('studentTableBody');

  if(!tbody) return;

  tbody.innerHTML = students.length
    ?
    students.map(s=>`
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
          Belum ada data murid pada pilihan tersebut.
        </td>
      </tr>
    `;
}
function downloadStudentTemplate(){

  if(typeof XLSX === 'undefined'){
    return toast(
      'Library Excel belum tersedia',
      'err'
    );
  }

  const data = [
    {
      'Nama Murid': '',
      'NIS': '',
      'Kelas': '',
      'Halaqoh': ''
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Data Murid'
  );

  XLSX.writeFile(
    workbook,
    'Template_Data_Murid.xlsx'
  );
}
function openStudentImport(){

  if(typeof XLSX === 'undefined'){
    return toast(
      'Library Excel belum tersedia',
      'err'
    );
  }

  const input = document.createElement('input');

  input.type = 'file';
  input.accept = '.xlsx,.xls';

  input.onchange = async (e) => {

    const file = e.target.files?.[0];

    if(!file) return;

    try{

      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(
        buffer,
        { type: 'array' }
      );

      const sheetName =
        workbook.SheetNames[0];

      const worksheet =
        workbook.Sheets[sheetName];

      const rows =
        XLSX.utils.sheet_to_json(
          worksheet,
          { defval: '' }
        );

      if(!rows.length){
        return toast(
          'File Excel tidak memiliki data',
          'err'
        );
      }

      const normalizedRows = rows.map(row => ({
        nama:
          String(
            row['Nama Murid'] ??
            row['Nama'] ??
            ''
          ).trim(),

        nis:
          String(
            row['NIS'] ??
            ''
          ).trim(),

        kelas:
          String(
            row['Kelas'] ??
            ''
          ).trim(),

        halaqoh:
          String(
            row['Halaqoh'] ??
            ''
          ).trim()
      }));

      window.studentImportPreview =
        normalizedRows;

      showStudentImportPreview(
        normalizedRows
      );

    }catch(error){

      console.error(error);

      toast(
        'Gagal membaca file Excel',
        'err'
      );

    }

  };

  input.click();
}
function previewCertificateBackground(input){

  const file =
    input?.files?.[0];

  if(!file){
    return;
  }


  if(file.size > 3 * 1024 * 1024){

    input.value = '';

    return toast(
      'Ukuran background sertifikat maksimal 3 MB',
      'err'
    );

  }


  const reader =
    new FileReader();


  reader.onload = function(e){

    const img =
      $('certificateBackgroundPreview');

    const empty =
      $('certificateBackgroundPreviewEmpty');


    if(img){

      img.src =
        e.target.result;

      img.classList.remove('hidden');

    }


    if(empty){

      empty.classList.add('hidden');

    }

  };


  reader.readAsDataURL(file);

}
function showStudentImportPreview(rows){
  window.studentImportRows = rows;
  const html = `
    <div class="bg-white rounded-2xl p-5 shadow-sm">

      <div class="flex items-center justify-between mb-4">

        <div>
          <b class="text-lg">
            Preview Impor Data Murid
          </b>

          <p class="text-xs text-slate-500">
            Periksa data sebelum disimpan.
          </p>
        </div>

        <button
          onclick="go('student')"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg">
          ← Kembali
        </button>

      </div>

      <div class="overflow-x-auto">

        <table class="w-full text-sm">

          <thead>
            <tr class="bg-slate-50">

              <th class="p-3 text-left">
                Nama Murid
              </th>

              <th class="p-3 text-left">
                NIS
              </th>

              <th class="p-3 text-left">
                Kelas
              </th>

              <th class="p-3 text-left">
                Halaqoh
              </th>

            </tr>
          </thead>

          <tbody>

            ${
              rows.map(row => `

                <tr class="border-t">

                  <td class="p-3">
                    ${esc(row.nama || '-')}
                  </td>

                  <td class="p-3">
                    ${esc(row.nis || '-')}
                  </td>

                  <td class="p-3">
                    ${esc(row.kelas || '-')}
                  </td>

                  <td class="p-3">
                    ${esc(row.halaqoh || '-')}
                  </td>

                </tr>

              `).join('')
            }

          </tbody>

        </table>

      </div>

<div class="mt-4 flex items-center justify-between gap-3">

  <div class="text-sm text-slate-600">
    Total data:
    <b>${rows.length}</b> murid
  </div>

  <button
    onclick="importStudentRows()"
    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold">
    📥 Impor Data
  </button>

</div>
  `;

  $('content').innerHTML = html;

}
function bindJournal(){} function bindReport(){} function bindExam(){} function bindGuru(){} function bindStudent(){}
function openModal(){$('modal').classList.remove('hidden')} function closeModal(){$('modal').classList.add('hidden')}
async function logout(){await sb?.auth.signOut();location.reload()}
(async()=>{if(!configured){$('configWarning').classList.remove('hidden');return}sb=window.supabase.createClient(cfg.url,cfg.anonKey);const {data}=await sb.auth.getSession();if(data.session)await start(data.session.user)})();
