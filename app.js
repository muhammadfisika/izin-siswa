```javascript
/*************************************************
 * SISTEM IZIN SISWA
 * FRONTEND
 * TAHAP 4
 *
 * ROLE:
 * WALI_KELAS
 * WAKASEK
 *************************************************/


/* ==============================================
   URL GOOGLE APPS SCRIPT
============================================== */

const API_URL =
  "https://script.google.com/macros/s/AKfycbyM4Gkh07mP5FaiJVDSrn2K6aIMSnDkwEP7T5NP9apMt93Y5wYEDUFUl3WK9dnS0cdM/exec";


/* ==============================================
   GLOBAL
============================================== */

let currentUser = null;

let dataIzinWakasek = [];

let filterAktif = "SEMUA";


/* ==============================================
   SAAT HALAMAN DIBUKA
============================================== */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const savedUser =
      localStorage.getItem(
        "izinSiswaUser"
      );


    if (savedUser) {

      try {

        currentUser =
          JSON.parse(savedUser);

        bukaDashboardSesuaiRole();

      } catch (error) {

        localStorage.removeItem(
          "izinSiswaUser"
        );

      }

    }


    const tanggal =
      document.getElementById(
        "tanggal"
      );


    if (tanggal) {

      tanggal.value =
        tanggalHariIni();

    }

  }
);


/* ==============================================
   LOGIN
============================================== */

async function login() {

  const username =
    document
      .getElementById("username")
      .value
      .trim();


  const password =
    document
      .getElementById("password")
      .value
      .trim();


  if (!username || !password) {

    tampilkanPesan(
      "loginMessage",
      "Username dan password wajib diisi.",
      "error"
    );

    return;

  }


  tampilkanLoading(true);


  try {

    const result =
      await requestAPI({

        action: "login",

        username:
          username,

        password:
          password

      });


    if (!result.success) {

      tampilkanPesan(
        "loginMessage",
        result.message,
        "error"
      );

      return;

    }


    currentUser =
      result.user;


    localStorage.setItem(
      "izinSiswaUser",
      JSON.stringify(
        currentUser
      )
    );


    bukaDashboardSesuaiRole();


  } catch (error) {

    tampilkanPesan(
      "loginMessage",
      error.message,
      "error"
    );

  } finally {

    tampilkanLoading(false);

  }

}


/* ==============================================
   BUKA DASHBOARD SESUAI ROLE
============================================== */

function bukaDashboardSesuaiRole() {

  /*
   * Sembunyikan semua dashboard
   */

  document
    .getElementById("loginPage")
    .classList
    .add("hidden");


  document
    .getElementById("waliPage")
    .classList
    .add("hidden");


  document
    .getElementById("wakasekPage")
    .classList
    .add("hidden");


  const role =
    String(
      currentUser.role || ""
    ).toUpperCase();


  if (
    role === "WALI_KELAS"
  ) {

    bukaDashboardWali();

    return;

  }


  if (
    role === "WAKASEK"
  ) {

    bukaDashboardWakasek();

    return;

  }


  /*
   * Role Penjaga dan Guru
   * dibuat pada tahap berikutnya.
   */

  document
    .getElementById("loginPage")
    .classList
    .remove("hidden");


  tampilkanPesan(
    "loginMessage",
    "Dashboard role " +
      role +
      " belum dibuat pada tahap ini.",
    "error"
  );

}


/* ==============================================
   DASHBOARD WALI KELAS
============================================== */

function bukaDashboardWali() {

  document
    .getElementById("waliPage")
    .classList
    .remove("hidden");


  document
    .getElementById("namaWali")
    .textContent =
    currentUser.nama || "-";


  document
    .getElementById("kelasWali")
    .textContent =
    currentUser.kelas || "-";


  const tanggal =
    document.getElementById(
      "tanggal"
    );


  if (tanggal) {

    tanggal.value =
      tanggalHariIni();

  }

}


/* ==============================================
   DASHBOARD WAKASEK
============================================== */

async function bukaDashboardWakasek() {

  document
    .getElementById("wakasekPage")
    .classList
    .remove("hidden");


  document
    .getElementById("namaWakasek")
    .textContent =
    currentUser.nama || "-";


  document
    .getElementById("tanggalWakasek")
    .textContent =
    formatTanggalIndonesia(
      tanggalHariIni()
    );


  await loadDataWakasek();

}


/* ==============================================
   LOAD DATA WAKASEK
============================================== */

async function loadDataWakasek() {

  const container =
    document.getElementById(
      "daftarIzinWakasek"
    );


  container.innerHTML =
    `
      <div class="empty-state">
        ⏳ Memuat data izin hari ini...
      </div>
    `;


  try {

    const result =
      await requestAPI({

        action:
          "dataWakasek",

        user:
          currentUser,

        tanggal:
          tanggalHariIni()

      });


    if (!result.success) {

      container.innerHTML =
        `
          <div class="empty-state">
            ❌ ${escapeHtml(
              result.message
            )}
          </div>
        `;

      return;

    }


    dataIzinWakasek =
      result.data || [];


    updateStatistikWakasek();


    renderDataWakasek();


  } catch (error) {

    container.innerHTML =
      `
        <div class="empty-state">
          ❌ ${escapeHtml(
            error.message
          )}
        </div>
      `;

  }

}


/* ==============================================
   STATISTIK WAKASEK
============================================== */

function updateStatistikWakasek() {

  const total =
    dataIzinWakasek.length;


  const menunggu =
    dataIzinWakasek.filter(
      function (item) {

        return String(
          item.STATUS_WAKASEK
        ).toUpperCase() ===
          "MENUNGGU";

      }
    ).length;


  const disetujui =
    dataIzinWakasek.filter(
      function (item) {

        return String(
          item.STATUS_WAKASEK
        ).toUpperCase() ===
          "DISETUJUI";

      }
    ).length;


  document
    .getElementById(
      "jumlahMenunggu"
    )
    .textContent =
    menunggu;


  document
    .getElementById(
      "jumlahDisetujui"
    )
    .textContent =
    disetujui;


  document
    .getElementById(
      "jumlahTotal"
    )
    .textContent =
    total;

}


/* ==============================================
   FILTER WAKASEK
============================================== */

function filterWakasek(
  filter
) {

  filterAktif =
    filter;


  document
    .querySelectorAll(
      ".filter-btn"
    )
    .forEach(
      function (button) {

        button
          .classList
          .remove("active");


        if (
          button.dataset.filter ===
          filter
        ) {

          button
            .classList
            .add("active");

        }

      }
    );


  renderDataWakasek();

}


/* ==============================================
   RENDER DATA WAKASEK
============================================== */

function renderDataWakasek() {

  const container =
    document.getElementById(
      "daftarIzinWakasek"
    );


  let data =
    [...dataIzinWakasek];


  if (
    filterAktif !==
    "SEMUA"
  ) {

    data =
      data.filter(
        function (item) {

          return String(
            item.STATUS_WAKASEK
          ).toUpperCase() ===
            filterAktif;

        }
      );

  }


  /*
   * Urutkan:
   * MENUNGGU di atas,
   * kemudian DISETUJUI.
   */

  data.sort(
    function (a, b) {

      const statusA =
        String(
          a.STATUS_WAKASEK
        ).toUpperCase();


      const statusB =
        String(
          b.STATUS_WAKASEK
        ).toUpperCase();


      if (
        statusA ===
        "MENUNGGU" &&
        statusB !==
        "MENUNGGU"
      ) {

        return -1;

      }


      if (
        statusA !==
        "MENUNGGU" &&
        statusB ===
        "MENUNGGU"
      ) {

        return 1;

      }


      return 0;

    }
  );


  if (data.length === 0) {

    container.innerHTML =
      `
        <div class="empty-state">
          📭 Tidak ada data izin
          ${filterAktif !== "SEMUA"
            ? "dengan status " +
              filterAktif
            : "hari ini"}.
        </div>
      `;

    return;

  }


  container.innerHTML = "";


  data.forEach(
    function (item) {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "permission-card";


      const foto =
        String(
          item.FOTO || ""
        ).trim();


      const photoHTML =
        foto
          ? `
              <img
                src="${escapeAttribute(foto)}"
                class="permission-photo"
                alt="Foto ${escapeAttribute(
                  item.NAMA_SISWA
                )}"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
              >

              <div
                class="permission-avatar"
                style="display:none"
              >
                👤
              </div>
            `
          : `
              <div class="permission-avatar">
                👤
              </div>
            `;


      const status =
        String(
          item.STATUS_WAKASEK || ""
        ).toUpperCase();


      const statusHTML =
        status ===
        "DISETUJUI"

          ? `
              <span class="status-badge status-disetujui">
                ✓ DISETUJUI
              </span>
            `

          : `
              <span class="status-badge status-menunggu">
                ⏳ MENUNGGU
              </span>
            `;


      const jenis =
        String(
          item.JENIS_IZIN || ""
        ).toUpperCase();


      const jenisIcon =
        jenis ===
        "KELUAR"
          ? "🚪"
          : "🏫";


      const waktu =
        jenis ===
        "KELUAR"

          ? (
              (item.WAKTU_KELUAR
                ? "Keluar: " +
                  item.WAKTU_KELUAR
                : "") +
              " " +
              (item.WAKTU_MASUK
                ? "Kembali: " +
                  item.WAKTU_MASUK
                : "")
            )

          : (
              item.WAKTU_MASUK
                ? "Masuk: " +
                  item.WAKTU_MASUK
                : ""
            );


      card.innerHTML = `

        ${photoHTML}

        <div class="permission-main">

          <div class="permission-name">

            ${escapeHtml(
              item.NAMA_SISWA
            )}

          </div>

          <div class="permission-meta">

            ${escapeHtml(
              item.KELAS
            )}

            • NIS:
            ${escapeHtml(
              item.NIS || "-"
            )}

            <br>

            ${jenisIcon}
            ${escapeHtml(
              jenis
            )}

            •
            ${escapeHtml(
              waktu
            )}

          </div>

          <div class="permission-reason">

            <strong>
              Alasan:
            </strong>

            ${escapeHtml(
              item.ALASAN
            )}

          </div>

          ${statusHTML}

        </div>


        <div class="permission-action">

          <button
            class="btn-detail"
            onclick="lihatDetailIzin('${escapeAttribute(
              item.ID_IZIN
            )}')"
          >
            Detail
          </button>

          ${
            status ===
            "MENUNGGU"

              ? `
                <button
                  class="btn-approve"
                  onclick="setujuiIzin('${escapeAttribute(
                    item.ID_IZIN
                  )}')"
                >
                  ✓ Setujui
                </button>
              `

              : `
                <button
                  class="btn-approve"
                  disabled
                >
                  ✓ Disetujui
                </button>
              `
          }

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );

}


/* ==============================================
   DETAIL IZIN
============================================== */

async function lihatDetailIzin(
  idIzin
) {

  const modal =
    document.getElementById(
      "detailModal"
    );


  const content =
    document.getElementById(
      "detailContent"
    );


  const action =
    document.getElementById(
      "detailAction"
    );


  modal
    .classList
    .remove("hidden");


  content.innerHTML =
    `
      <div class="empty-state">
        ⏳ Memuat detail...
      </div>
    `;


  action.innerHTML = "";


  try {

    const result =
      await requestAPI({

        action:
          "detailIzin",

        idIzin:
          idIzin

      });


    if (!result.success) {

      content.innerHTML =
        `
          <div class="empty-state">
            ❌ ${escapeHtml(
              result.message
            )}
          </div>
        `;

      return;

    }


    const izin =
      result.data.izin || {};


    const siswa =
      result.data.siswa || {};


    const foto =
      String(
        siswa.FOTO ||
        ""
      ).trim();


    const fotoHTML =
      foto

        ? `
            <img
              src="${escapeAttribute(foto)}"
              class="detail-photo"
              alt="Foto siswa"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
            >

            <div
              class="detail-avatar"
              style="display:none"
            >
              👤
            </div>
          `

        : `
            <div class="detail-avatar">
              👤
            </div>
          `;


    const status =
      String(
        izin.STATUS_WAKASEK ||
        ""
      ).toUpperCase();


    content.innerHTML = `

      ${fotoHTML}

      <div class="detail-name">

        ${escapeHtml(
          izin.NAMA_SISWA ||
          siswa.NAMA_SISWA ||
          "-"
        )}

      </div>


      <div class="detail-row">

        <span class="detail-label">
          NIS
        </span>

        <span class="detail-value">
          ${escapeHtml(
            siswa.NIS ||
            izin.NIS ||
            "-"
          )}
        </span>

      </div>


      <div class="detail-row">

        <span class="detail-label">
          Kelas
        </span>

        <span class="detail-value">
          ${escapeHtml(
            izin.KELAS ||
            siswa.KELAS ||
            "-"
          )}
        </span>

      </div>


      <div class="detail-row">

        <span class="detail-label">
          Jenis Izin
        </span>

        <span class="detail-value">
          ${escapeHtml(
            izin.JENIS_IZIN ||
            "-"
          )}
        </span>

      </div>


      <div class="detail-row">

        <span class="detail-label">
          Alasan
        </span>

        <span class="detail-value">
          ${escapeHtml(
            izin.ALASAN ||
            "-"
          )}
        </span>

      </div>


      <div class="detail-row">

        <span class="detail-label">
          Waktu Keluar
        </span>

        <span class="detail-value">
          ${escapeHtml(
            izin.WAKTU_KELUAR ||
            "-"
          )}
        </span>

      </div>


      <div class="detail-row">

        <span class="detail-label">
          Waktu Masuk
        </span>

        <span class="detail-value">
          ${escapeHtml(
            izin.WAKTU_MASUK ||
            "-"
          )}
        </span>

      </div>


      <div class="detail-row">

        <span class="detail-label">
          Wali Kelas
        </span>

        <span class="detail-value">
          ${escapeHtml(
            izin.NAMA_WALI ||
            "-"
          )}
        </span>

      </div>


      <div class="detail-row">

        <span class="detail-label">
          Status Wali
        </span>

        <span class="detail-value">
          ✓ DIIZINKAN
        </span>

      </div>


      <div class="detail-row">

        <span class="detail-label">
          Status Wakasek
        </span>

        <span class="detail-value">

          ${
            status ===
            "DISETUJUI"

              ? "✓ DISETUJUI"

              : "⏳ MENUNGGU"

          }

        </span>

      </div>

    `;


    if (
      status ===
      "MENUNGGU"
    ) {

      action.innerHTML = `

        <button
          class="btn btn-success btn-full"
          onclick="setujuiIzin('${escapeAttribute(
            idIzin
          )}');tutupDetail();"
        >
          ✓ SETUJUI IZIN
        </button>

      `;

    }


  } catch (error) {

    content.innerHTML =
      `
        <div class="empty-state">
          ❌ ${escapeHtml(
            error.message
          )}
        </div>
      `;

  }

}


/* ==============================================
   SETUJUI IZIN
============================================== */

async function setujuiIzin(
  idIzin
) {

  if (!idIzin) {

    return;

  }


  const konfirmasi =
    confirm(
      "Apakah Anda yakin ingin menyetujui izin siswa ini?"
    );


  if (!konfirmasi) {

    return;

  }


  tampilkanLoading(true);


  try {

    const result =
      await requestAPI({

        action:
          "approveIzin",

        user:
          currentUser,

        idIzin:
          idIzin

      });


    if (!result.success) {

      alert(
        "❌ " +
        result.message
      );

      return;

    }


    alert(
      "✅ " +
      result.message
    );


    /*
     * Ambil ulang data dari server
     */

    await loadDataWakasek();


  } catch (error) {

    alert(
      "❌ Gagal menyetujui izin: " +
      error.message
    );

  } finally {

    tampilkanLoading(false);

  }

}


/* ==============================================
   TUTUP DETAIL
============================================== */

function tutupDetail() {

  document
    .getElementById(
      "detailModal"
    )
    .classList
    .add("hidden");

}


/* ==============================================
   WALI KELAS
   CARI SISWA
============================================== */

function cariSiswaKey(
  event
) {

  if (
    event.key ===
    "Enter"
  ) {

    cariSiswa();

  }

}


/* ==============================================
   CARI SISWA
============================================== */

async function cariSiswa() {

  if (!currentUser) {

    return;

  }


  const keyword =
    document
      .getElementById(
        "keywordSiswa"
      )
      .value
      .trim();


  const hasil =
    document.getElementById(
      "hasilSiswa"
    );


  hasil.innerHTML =
    "<p>Mencari siswa...</p>";


  try {

    const result =
      await requestAPI({

        action:
          "cariSiswa",

        kelas:
          currentUser.kelas,

        keyword:
          keyword

      });


    if (!result.success) {

      hasil.innerHTML =
        `
          <p>
            ❌ ${escapeHtml(
              result.message
            )}
          </p>
        `;

      return;

    }


    if (
      !result.data ||
      result.data.length === 0
    ) {

      hasil.innerHTML =
        "<p>❌ Siswa tidak ditemukan.</p>";

      return;

    }


    hasil.innerHTML = "";


    result.data.forEach(
      function (siswa) {

        const item =
          document.createElement(
            "div"
          );


        item.className =
          "student-item";


        item.innerHTML = `

          <div class="student-info">

            <div class="student-name">

              ${escapeHtml(
                siswa.NAMA_SISWA
              )}

            </div>

            <div class="student-class">

              NIS:
              ${escapeHtml(
                siswa.NIS
              )}

              • Kelas:
              ${escapeHtml(
                siswa.KELAS
              )}

            </div>

          </div>


          <button
            class="btn-select"
            onclick='pilihSiswa(${JSON.stringify(
              siswa
            )})'
          >
            Pilih
          </button>

        `;


        hasil.appendChild(
          item
        );

      }
    );


  } catch (error) {

    hasil.innerHTML =
      `
        <p>
          ❌ ${escapeHtml(
            error.message
          )}
        </p>
      `;

  }

}


/* ==============================================
   PILIH SISWA
============================================== */

function pilihSiswa(
  siswa
) {

  document
    .getElementById(
      "formIzinCard"
    )
    .classList
    .remove("hidden");


  document
    .getElementById(
      "idSiswa"
    )
    .value =
    siswa.ID_SISWA;


  document
    .getElementById(
      "siswaTerpilih"
    )
    .innerHTML = `

      <strong>
        ${escapeHtml(
          siswa.NAMA_SISWA
        )}
      </strong>

      <br>

      <small>

        NIS:
        ${escapeHtml(
          siswa.NIS
        )}

        |

        Kelas:
        ${escapeHtml(
          siswa.KELAS
        )}

      </small>

    `;


  document
    .getElementById(
      "formIzinCard"
    )
    .scrollIntoView({
      behavior: "smooth"
    });

}


/* ==============================================
   JENIS IZIN
============================================== */

function ubahJenisIzin() {

  const selected =
    document.querySelector(
      'input[name="jenisIzin"]:checked'
    );


  if (!selected) {

    return;

  }


  const jenis =
    selected.value;


  const group =
    document.getElementById(
      "groupWaktuKeluar"
    );


  if (
    jenis ===
    "KELUAR"
  ) {

    group
      .classList
      .remove("hidden");

  } else {

    group
      .classList
      .add("hidden");

  }

}


/* ==============================================
   SIMPAN IZIN
============================================== */

async function simpanIzin() {

  if (!currentUser) {

    return;

  }


  const idSiswa =
    document
      .getElementById(
        "idSiswa"
      )
      .value;


  const tanggal =
    document
      .getElementById(
        "tanggal"
      )
      .value;


  const jenis =
    document.querySelector(
      'input[name="jenisIzin"]:checked'
    ).value;


  const alasan =
    document
      .getElementById(
        "alasan"
      )
      .value
      .trim();


  const waktuKeluar =
    document
      .getElementById(
        "waktuKeluar"
      )
      .value;


  const waktuMasuk =
    document
      .getElementById(
        "waktuMasuk"
      )
      .value;


  if (!idSiswa) {

    tampilkanPesan(
      "izinMessage",
      "Silakan pilih siswa terlebih dahulu.",
      "error"
    );

    return;

  }


  if (!tanggal) {

    tampilkanPesan(
      "izinMessage",
      "Tanggal izin wajib diisi.",
      "error"
    );

    return;

  }


  if (!alasan) {

    tampilkanPesan(
      "izinMessage",
      "Alasan izin wajib diisi.",
      "error"
    );

    return;

  }


  if (
    jenis ===
    "KELUAR" &&
    !waktuKeluar
  ) {

    tampilkanPesan(
      "izinMessage",
      "Waktu keluar wajib diisi.",
      "error"
    );

    return;

  }


  if (!waktuMasuk) {

    tampilkanPesan(
      "izinMessage",
      "Waktu masuk/kembali wajib diisi.",
      "error"
    );

    return;

  }


  tampilkanLoading(true);


  try {

    const result =
      await requestAPI({

        action:
          "simpanIzin",

        user:
          currentUser,

        idSiswa:
          idSiswa,

        tanggal:
          tanggal,

        jenisIzin:
          jenis,

        alasan:
          alasan,

        waktuKeluar:
          waktuKeluar,

        waktuMasuk:
          waktuMasuk

      });


    if (!result.success) {

      tampilkanPesan(
        "izinMessage",
        result.message,
        "error"
      );

      return;

    }


    tampilkanPesan(
      "izinMessage",
      "✅ Izin berhasil disimpan. ID: " +
        result.idIzin,
      "success"
    );


    resetFormIzin();


  } catch (error) {

    tampilkanPesan(
      "izinMessage",
      "Gagal menyimpan izin: " +
        error.message,
      "error"
    );

  } finally {

    tampilkanLoading(false);

  }

}


/* ==============================================
   RESET FORM
============================================== */

function resetFormIzin() {

  document
    .getElementById(
      "idSiswa"
    )
    .value = "";


  document
    .getElementById(
      "alasan"
    )
    .value = "";


  document
    .getElementById(
      "waktuKeluar"
    )
    .value = "";


  document
    .getElementById(
      "waktuMasuk"
    )
    .value = "";


  document
    .getElementById(
      "keywordSiswa"
    )
    .value = "";


  document
    .getElementById(
      "hasilSiswa"
    )
    .innerHTML = "";


  document
    .getElementById(
      "formIzinCard"
    )
    .classList
    .add("hidden");

}


/* ==============================================
   LOGOUT
============================================== */

function logout() {

  localStorage.removeItem(
    "izinSiswaUser"
  );


  currentUser = null;


  location.reload();

}


/* ==============================================
   REQUEST API
============================================== */

async function requestAPI(
  data
) {

  if (
    !API_URL ||
    API_URL.includes(
      "GANTI_DENGAN_URL"
    )
  ) {

    throw new Error(
      "URL Apps Script belum dimasukkan ke app.js."
    );

  }


  const response =
    await fetch(
      API_URL,
      {

        method:
          "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body:
          JSON.stringify(
            data
          )

      }
    );


  if (!response.ok) {

    throw new Error(
      "Server memberikan HTTP " +
        response.status
    );

  }


  return await response.json();

}


/* ==============================================
   PESAN
============================================== */

function tampilkanPesan(
  elementId,
  message,
  type
) {

  const element =
    document.getElementById(
      elementId
    );


  if (!element) {

    return;

  }


  element.textContent =
    message;


  element.className =
    "message " +
    type;

}


/* ==============================================
   LOADING
============================================== */

function tampilkanLoading(
  show
) {

  const element =
    document.getElementById(
      "loading"
    );


  if (!element) {

    return;

  }


  if (show) {

    element
      .classList
      .remove("hidden");

  } else {

    element
      .classList
      .add("hidden");

  }

}


/* ==============================================
   TANGGAL HARI INI
============================================== */

function tanggalHariIni() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    year +
    "-" +
    month +
    "-" +
    day
  );

}


/* ==============================================
   FORMAT TANGGAL INDONESIA
============================================== */

function formatTanggalIndonesia(
  tanggal
) {

  const parts =
    tanggal.split("-");


  if (
    parts.length !== 3
  ) {

    return tanggal;

  }


  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
  ];


  return (
    Number(parts[2]) +
    " " +
    bulan[
      Number(parts[1]) - 1
    ] +
    " " +
    parts[0]
  );

}


/* ==============================================
   ESCAPE HTML
============================================== */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* ==============================================
   ESCAPE ATTRIBUTE
============================================== */

function escapeAttribute(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    );

}
```
