aku membutuhkan sebuah platform yang untukku menyingkat url panjang atau shortlink.

aku ingin menggunakan domain s.ten.my.id
dan menggunakan github untuk menyimpan kode platformnya dan akan menggunakan cloudflare untu kmendeploykannya. untuk database aku ingin menggunakan KV dari cloudflare. 

aku ingin ui ux nya sederhana saja tanpa tampahan yang tidak perlu, jadi hanya fokus pada fungsinya saja. tidak perlu banyak deskrisptif yang ngak perlu.

platform ini diperuntukkan untuk kebutuhan digital personal pribadiku.

saat di akses akan membuka halaman login dan saat berhasil akan masuk ke halaman admin untuk mengelola paltfrom ini.

nah setiap asset didaftarkan atau di hosting di paltform cdn ini akan menggunakan domain s.ten.my.id/ dengan karakterter acak dibelakangnya dan tidak boleh sama untuk setiap asset. kemudian bisa ditambahkan custom pathnya biar bisa sesuai kebutuhan. dan bisa ditambahkan kategorinya supaya rapi.

push ke github https://github.com/lastengtf/s-tenmyid

dan KV nya
"binding": "DB_KV",
"id": "90962425ca2b4ad9a35962afc35f3690"


untuk mengakses platformnya perlu login dengan email dan password. nah email dan password harus sesuai yang ada di variabel di dashboard claoudflare.
