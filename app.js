// =====================================================
// KONFIGURASI
// =====================================================

const API_URL =
  "GANTI_DENGAN_URL_WEB_APP_APPS_SCRIPT";


// =====================================================
// GLOBAL
// =====================================================

let currentUser = null;

let dataIzinWakasek = [];

let filterAktif = "SEMUA";

let siswaTerpilih = null;


// =====================================================
// LOGIN
// =====================================================

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


  const message =
    document.getElementById(
      "loginMessage"
    );


  message.innerHTML = "";


  if (!username) {

    tampilkanPesanLogin(
      "Username wajib diisi.",
      "error"
    );

    return;
  }


  if (!password) {

    tampilkanPesanLogin(
      "Password wajib diisi.",
      "error"
    );

    return;
  }


  tampilkanLoading(true);


  try {

    const response =
      await requestAPI({

        action: "login",

        username: username,

        password: password

      });


    console.log(
      "RESPON LOGIN:",
      response
    );


    if (
      !response ||
      response.success !== true
    ) {

      tampilkanPesanLogin(

        response &&
        response.message

          ? response.message

          : "Username atau password salah.",

        "error"

      );

      tampilkanLoading(false);

      return;
    }


    currentUser =
      response.user;


    if (!currentUser) {

      tampilkanPesanLogin(
        "Data pengguna tidak ditemukan.",
        "error"
      );

      tampilkanLoading(false);

      return;
    }


    // Simpan sesi sementara
    sessionStorage.setItem(
      "currentUser",
      JSON.stringify(currentUser)
    );


    document
      .getElementById("loginPage")
      .classList.remove("active");


    bukaDashboardSesuaiRole();


  } catch (error) {

    console.error(
      "ERROR LOGIN:",
      error
    );


    tampilkanPesanLogin(

      "Login gagal. Periksa URL Apps Script dan koneksi internet.",

      "error"

    );

  }


  tampilkanLoading(false);
}


// =====================================================
// PESAN LOGIN
// =====================================================

function tampilkanPesanLogin(
  pesan,
  tipe
) {

  const el =
    document.getElementById(
      "loginMessage"
    );


  el.innerHTML =
    pesan;


  el.className =
    "message " +
    (
      tipe === "error"
        ? "message-error"
        : "message-success"
    );

}


// =====================================================
// DASHBOARD SESUAI ROLE
// =====================================================

function bukaDashboardSesuaiRole() {

  // Sembunyikan semua halaman
  document
    .querySelectorAll(".page")
    .forEach(
      function(page) {

        page.classList.remove(
          "active"
        );

      }
    );


  const role =
    String(
      currentUser.role || ""
    )
    .trim()
    .toUpperCase();


  console.log(
    "ROLE LOGIN:",
    role
  );


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


  if (
    role === "PENJAGA"
  ) {

    alert(
      "Dashboard Penjaga belum dibuat pada tahap ini."
    );

    logout();

    return;
  }


  if (
    role === "GURU"
  ) {

    alert(
      "Dashboard Guru belum dibuat pada tahap ini."
    );

    logout();

    return;
  }


  alert(
    "Role pengguna tidak dikenali: " +
    role
  );

  logout();
}


// =====================================================
// DASHBOARD WALI
// =====================================================

function bukaDashboardWali() {

  document
    .getElementById("waliPage")
    .classList.add("active");


  document
    .getElementById("waliInfo")
    .innerHTML =

      escapeHtml(
        currentUser.nama || "-"
      )

      +

      " | Kelas: "

      +

      escapeHtml(
        currentUser.kelas || "-"
      );


  document
    .getElementById(
      "tanggalIzin"
    )
    .value =
      tanggalHariIni();

}


// =====================================================
// DASHBOARD WAKASEK
// =====================================================

function bukaDashboardWakasek() {

  document
    .getElementById(
      "wakasekPage"
    )
    .classList.add("active");


  document
    .getElementById(
      "wakasekInfo"
    )
    .innerHTML =
      escapeHtml(
        currentUser.nama || "-"
      );


  loadDataWakasek();
}


// =====================================================
// LOAD DATA WAKASEK
// =====================================================

async function loadDataWakasek() {

  tampilkanLoading(true);


  try {

    const response =
      await requestAPI({

        action:
          "dataWakasek",

        user:
          currentUser,

        tanggal:
          tanggalHariIni()

      });


    console.log(
      "DATA WAKASEK:",
      response
    );


    if (
      !response ||
      response.success !== true
    ) {

      alert(
        response &&
        response.message

          ? response.message

          : "Gagal mengambil data."
      );

      return;
    }


    dataIzinWakasek =
      response.data || [];


    updateStatistikWakasek();

    renderDataWakasek();


  } catch (error) {

    console.error(
      error
    );

    alert(
      "Gagal memuat data Wakasek."
    );

  }


  tampilkanLoading(false);
}


// =====================================================
// STATISTIK
// =====================================================

function updateStatistikWakasek() {

  const total =
    dataIzinWakasek.length;


  const menunggu =
    dataIzinWakasek.filter(
      function(item) {

        return String(
          item.STATUS_WAKASEK || ""
        )
        .toUpperCase() ===
        "MENUNGGU";

      }
    ).length;


  const disetujui =
    dataIzinWakasek.filter(
      function(item) {

        return String(
          item.STATUS_WAKASEK || ""
        )
        .toUpperCase() ===
        "DISETUJUI";

      }
    ).length;


  document
    .getElementById(
      "statTotal"
    )
    .innerText =
      total;


  document
    .getElementById(
      "statMenunggu"
    )
    .innerText =
      menunggu;


  document
    .getElementById(
      "statDisetujui"
    )
    .innerText =
      disetujui;
}


// =====================================================
// FILTER WAKASEK
// =====================================================

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
      function(button) {

        button.classList.remove(
          "active"
        );

      }
    );


  event.target.classList.add(
    "active"
  );


  renderDataWakasek();
}


// =====================================================
// RENDER DATA WAKASEK
// =====================================================

function renderDataWakasek() {

  const container =
    document.getElementById(
      "daftarIzinWakasek"
    );


  let data =
    [...dataIzinWakasek];


  if (
    filterAktif !== "SEMUA"
  ) {

    data =
      data.filter(
        function(item) {

          return String(
            item.STATUS_WAKASEK || ""
          )
          .toUpperCase() ===
          filterAktif;

        }
      );

  }


  if (data.length === 0) {

    container.innerHTML =

      `<div class="empty-state">
        Tidak ada data izin hari ini.
      </div>`;

    return;
  }


  container.innerHTML =
    data.map(
      function(item) {

        const status =
          String(
            item.STATUS_WAKASEK || ""
          )
          .toUpperCase();


        const tombol =
          status === "MENUNGGU"

            ?

          `<button
             class="btn btn-success"
             onclick="setujuiIzin('${escapeAttribute(item.ID_IZIN)}')"
           >
             SETUJUI
           </button>`

            :

          `<span class="badge badge-success">
             DISETUJUI
           </span>`;


        return `

          <div class="permission-card">

            <div class="permission-photo">

              ${
                item.FOTO

                ?

                `<img
                   src="${escapeAttribute(item.FOTO)}"
                   onerror="this.style.display='none'"
                 >`

                :

                `<div class="photo-placeholder">
                   👤
                 </div>`
              }

            </div>


            <div class="permission-content">

              <h3>
                ${escapeHtml(
                  item.NAMA_SISWA || "-"
                )}
              </h3>


              <p>
                NIS:
                ${escapeHtml(
                  item.NIS || "-"
                )}
              </p>


              <p>
                Kelas:
                ${escapeHtml(
                  item.KELAS || "-"
                )}
              </p>


              <p>
                Jenis:
                <strong>
                  ${escapeHtml(
                    item.JENIS_IZIN || "-"
                  )}
                </strong>
              </p>


              <p>
                Waktu:
                ${escapeHtml(
                  item.WAKTU_KELUAR || "-"
                )}
                -
                ${escapeHtml(
                  item.WAKTU_MASUK || "-"
                )}
              </p>


              <div class="permission-actions">

                <button
                  class="btn btn-secondary"
                  onclick="lihatDetailIzin('${escapeAttribute(item.ID_IZIN)}')"
                >
                  DETAIL
                </button>

                ${tombol}

              </div>

            </div>

          </div>

        `;

      }
    )
    .join("");
}


// =====================================================
// DETAIL IZIN
// =====================================================

function lihatDetailIzin(
  idIzin
) {

  const item =
    dataIzinWakasek.find(
      function(row) {

        return String(
          row.ID_IZIN
        ) === String(
          idIzin
        );

      }
    );


  if (!item) {

    alert(
      "Data izin tidak ditemukan."
    );

    return;
  }


  document
    .getElementById(
      "detailIsi"
    )
    .innerHTML = `

      <p>
        <strong>Nama:</strong>
        ${escapeHtml(
          item.NAMA_SISWA || "-"
        )}
      </p>

      <p>
        <strong>NIS:</strong>
        ${escapeHtml(
          item.NIS || "-"
        )}
      </p>

      <p>
        <strong>Kelas:</strong>
        ${escapeHtml(
          item.KELAS || "-"
        )}
      </p>

      <p>
        <strong>Tanggal:</strong>
        ${escapeHtml(
          formatTanggalIndonesia(
            item.TANGGAL
          )
        )}
      </p>

      <p>
        <strong>Jenis Izin:</strong>
        ${escapeHtml(
          item.JENIS_IZIN || "-"
        )}
      </p>

      <p>
        <strong>Alasan:</strong>
        ${escapeHtml(
          item.ALASAN || "-"
        )}
      </p>

      <p>
        <strong>Waktu Keluar:</strong>
        ${escapeHtml(
          item.WAKTU_KELUAR || "-"
        )}
      </p>

      <p>
        <strong>Waktu Masuk:</strong>
        ${escapeHtml(
          item.WAKTU_MASUK || "-"
        )}
      </p>

      <p>
        <strong>Status Wali:</strong>
        ${escapeHtml(
          item.STATUS_WALI || "-"
        )}
      </p>

      <p>
        <strong>Status Wakasek:</strong>
        ${escapeHtml(
          item.STATUS_WAKASEK || "-"
        )}
      </p>

    `;


  document
    .getElementById(
      "detailModal"
    )
    .classList.remove(
      "hidden"
    );
}


// =====================================================
// SETUJUI IZIN
// =====================================================

async function setujuiIzin(
  idIzin
) {

  const item =
    dataIzinWakasek.find(
      function(row) {

        return String(
          row.ID_IZIN
        ) === String(
          idIzin
        );

      }
    );


  if (!item) {

    alert(
      "Data izin tidak ditemukan."
    );

    return;
  }


  if (
    String(
      item.STATUS_WAKASEK || ""
    ).toUpperCase() ===
    "DISETUJUI"
  ) {

    alert(
      "Izin ini sudah disetujui."
    );

    return;
  }


  const konfirmasi =
    confirm(

      "Setujui izin siswa " +

      item.NAMA_SISWA +

      "?"

    );


  if (!konfirmasi) {

    return;
  }


  tampilkanLoading(true);


  try {

    const response =
      await requestAPI({

        action:
          "setujuiIzin",

        idIzin:
          idIzin,

        user:
          currentUser

      });


    if (
      !response ||
      response.success !== true
    ) {

      alert(
        response &&
        response.message

          ? response.message

          : "Gagal menyetujui izin."
      );

      return;
    }


    alert(
      "Izin berhasil disetujui."
    );


    await loadDataWakasek();


  } catch (error) {

    console.error(
      error
    );

    alert(
      "Terjadi kesalahan saat menyetujui izin."
    );

  }


  tampilkanLoading(false);
}


// =====================================================
// TUTUP DETAIL
// =====================================================

function tutupDetail() {

  document
    .getElementById(
      "detailModal"
    )
    .classList.add(
      "hidden"
    );
}


// =====================================================
// CARI SISWA
// =====================================================

let timerCari = null;


function cariSiswa() {

  clearTimeout(
    timerCari
  );


  timerCari =
    setTimeout(
      async function() {

        const keyword =
          document
            .getElementById(
              "cariSiswaInput"
            )
            .value
            .trim();


        if (
          keyword.length < 2
        ) {

          document
            .getElementById(
              "hasilPencarianSiswa"
            )
            .innerHTML =
              "";

          return;
        }


        try {

          const response =
            await requestAPI({

              action:
                "cariSiswa",

              keyword:
                keyword,

              user:
                currentUser

            });


          if (
            !response ||
            response.success !== true
          ) {

            return;
          }


          const siswa =
            response.data || [];


          const container =
            document
              .getElementById(
                "hasilPencarianSiswa"
              );


          if (
            siswa.length === 0
          ) {

            container.innerHTML =
              `<div class="empty-state">
                Siswa tidak ditemukan.
              </div>`;

            return;
          }


          container.innerHTML =
            siswa.map(
              function(row) {

                return `

                  <div
                    class="student-item"
                    onclick='pilihSiswa(${JSON.stringify(row).replace(/'/g, "&apos;")})'
                  >

                    <strong>
                      ${escapeHtml(
                        row.NAMA_SISWA || "-"
                      )}
                    </strong>

                    <small>
                      ${escapeHtml(
                        row.KELAS || "-"
                      )}
                      |
                      NIS:
                      ${escapeHtml(
                        row.NIS || "-"
                      )}
                    </small>

                  </div>

                `;

              }
            )
            .join("");

        } catch (error) {

          console.error(
            error
          );

        }

      },
      300
    );
}


// =====================================================
// PILIH SISWA
// =====================================================

function pilihSiswa(
  siswa
) {

  siswaTerpilih =
    siswa;


  document
    .getElementById(
      "hasilPencarianSiswa"
    )
    .innerHTML =
      "";


  document
    .getElementById(
      "cariSiswaInput"
    )
    .value =
      siswa.NAMA_SISWA || "";


  document
    .getElementById(
      "siswaTerpilih"
    )
    .classList.remove(
      "hidden"
    );


  document
    .getElementById(
      "siswaTerpilih"
    )
    .innerHTML = `

      <strong>
        ${escapeHtml(
          siswa.NAMA_SISWA || "-"
        )}
      </strong>

      <br>

      Kelas:
      ${escapeHtml(
        siswa.KELAS || "-"
      )}

      <br>

      NIS:
      ${escapeHtml(
        siswa.NIS || "-"
      )}

    `;


  document
    .getElementById(
      "formIzin"
    )
    .classList.remove(
      "hidden"
    );
}


// =====================================================
// JENIS IZIN
// =====================================================

function ubahJenisIzin() {

  // Disiapkan agar tetap kompatibel
  // dengan tahap sebelumnya.

}


// =====================================================
// SIMPAN IZIN
// =====================================================

async function simpanIzin() {

  if (!siswaTerpilih) {

    alert(
      "Silakan pilih siswa terlebih dahulu."
    );

    return;
  }


  const tanggal =
    document
      .getElementById(
        "tanggalIzin"
      )
      .value;


  const jenis =
    document
      .querySelector(
        'input[name="jenisIzin"]:checked'
      );


  const alasan =
    document
      .getElementById(
        "alasanIzin"
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


  if (!tanggal) {

    alert(
      "Tanggal harus diisi."
    );

    return;
  }


  if (!jenis) {

    alert(
      "Pilih jenis izin."
    );

    return;
  }


  if (!alasan) {

    alert(
      "Alasan izin harus diisi."
    );

    return;
  }


  tampilkanLoading(true);


  try {

    const response =
      await requestAPI({

        action:
          "simpanIzin",

        user:
          currentUser,

        idSiswa:
          siswaTerpilih.ID_SISWA,

        tanggal:
          tanggal,

        jenisIzin:
          jenis.value,

        alasan:
          alasan,

        waktuKeluar:
          waktuKeluar,

        waktuMasuk:
          waktuMasuk

      });


    if (
      !response ||
      response.success !== true
    ) {

      alert(
        response &&
        response.message

          ? response.message

          : "Gagal menyimpan izin."
      );

      return;
    }


    alert(
      "Izin berhasil disimpan."
    );


    resetFormIzin();


  } catch (error) {

    console.error(
      error
    );

    alert(
      "Terjadi kesalahan saat menyimpan izin."
    );

  }


  tampilkanLoading(false);
}


// =====================================================
// RESET FORM
// =====================================================

function resetFormIzin() {

  siswaTerpilih =
    null;


  document
    .getElementById(
      "cariSiswaInput"
    )
    .value =
      "";


  document
    .getElementById(
      "hasilPencarianSiswa"
    )
    .innerHTML =
      "";


  document
    .getElementById(
      "siswaTerpilih"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "formIzin"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "alasanIzin"
    )
    .value =
      "";


  document
    .getElementById(
      "waktuKeluar"
    )
    .value =
      "";


  document
    .getElementById(
      "waktuMasuk"
    )
    .value =
      "";


  document
    .querySelectorAll(
      'input[name="jenisIzin"]'
    )
    .forEach(
      function(input) {

        input.checked =
          false;

      }
    );


  document
    .getElementById(
      "tanggalIzin"
    )
    .value =
      tanggalHariIni();
}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

  currentUser =
    null;


  siswaTerpilih =
    null;


  dataIzinWakasek =
    [];


  sessionStorage.removeItem(
    "currentUser"
  );


  document
    .querySelectorAll(
      ".page"
    )
    .forEach(
      function(page) {

        page.classList.remove(
          "active"
        );

      }
    );


  document
    .getElementById(
      "loginPage"
    )
    .classList.add(
      "active"
    );


  document
    .getElementById(
      "username"
    )
    .value =
      "";


  document
    .getElementById(
      "password"
    )
    .value =
      "";


  document
    .getElementById(
      "loginMessage"
    )
    .innerHTML =
      "";
}


// =====================================================
// REQUEST API
// =====================================================

async function requestAPI(
  data
) {

  console.log(
    "REQUEST:",
    data
  );


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
      "HTTP Error " +
      response.status
    );

  }


  const text =
    await response.text();


  console.log(
    "RAW RESPONSE:",
    text
  );


  try {

    return JSON.parse(
      text
    );

  } catch (error) {

    console.error(
      "Response bukan JSON:",
      text
    );


    throw new Error(
      "Server tidak mengembalikan JSON."
    );

  }
}


// =====================================================
// LOADING
// =====================================================

function tampilkanLoading(
  tampil
) {

  const loading =
    document.getElementById(
      "loading"
    );


  if (tampil) {

    loading.classList.remove(
      "hidden"
    );

  } else {

    loading.classList.add(
      "hidden"
    );

  }
}


// =====================================================
// TANGGAL HARI INI
// =====================================================

function tanggalHariIni() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    )
    .padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    )
    .padStart(
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


// =====================================================
// FORMAT TANGGAL
// =====================================================

function formatTanggalIndonesia(
  tanggal
) {

  if (!tanggal) {

    return "-";

  }


  const date =
    new Date(
      tanggal
    );


  if (
    isNaN(
      date.getTime()
    )
  ) {

    return tanggal;

  }


  return date.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}


// =====================================================
// ESCAPE HTML
// =====================================================

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


// =====================================================
// ESCAPE ATTRIBUTE
// =====================================================

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );
}


// =====================================================
// CEK SESSION
// =====================================================

window.addEventListener(
  "DOMContentLoaded",
  function() {

    const saved =
      sessionStorage.getItem(
        "currentUser"
      );


    if (!saved) {

      return;

    }


    try {

      currentUser =
        JSON.parse(
          saved
        );


      if (
        currentUser &&
        currentUser.role
      ) {

        bukaDashboardSesuaiRole();

      }

    } catch (error) {

      sessionStorage.removeItem(
        "currentUser"
      );

    }

  }
);
