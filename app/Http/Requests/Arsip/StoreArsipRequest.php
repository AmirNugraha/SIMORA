<?php

namespace App\Http\Requests\Arsip;

use Illuminate\Foundation\Http\FormRequest;

class StoreArsipRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'nomor_berkas'        => 'required|string|max:100',
            'bulan'               => 'required|integer|min:1|max:12',
            'tanggal'             => 'required|date_format:Y-m-d',
            'kode_transaksi_id'   => 'nullable|exists:kode_transaksis,id',
            'sumber_dana_id'      => 'nullable|exists:sumber_danas,id',
            'arsip_kegiatan_id'   => 'nullable|exists:arsip_kegiatans,id',
            'akun_id'             => 'nullable|exists:akuns,id',
            'metode_pengadaan_id' => 'nullable|exists:metode_pengadaans,id',
            'penerima_dana'       => 'required|string|max:255',
            'uraian_kegiatan'     => 'required|string',
            'jumlah_bruto'        => 'required|numeric|min:0',
            'potongan'            => 'numeric|min:0',
            'ppk'                 => 'nullable|string|max:255',
            'file'                => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ];
    }

    public function messages(): array
    {
        return [
            'nomor_berkas.required'    => 'Nomor berkas wajib diisi.',
            'bulan.required'           => 'Bulan wajib dipilih.',
            'tanggal.required'         => 'Tanggal wajib diisi.',
            'penerima_dana.required'   => 'Penerima dana wajib diisi.',
            'uraian_kegiatan.required' => 'Uraian kegiatan wajib diisi.',
            'jumlah_bruto.required'    => 'Jumlah bruto wajib diisi.',
            'file.mimes'              => 'File harus berformat PDF, JPG, atau PNG.',
            'file.max'                => 'Ukuran file maksimal 10 MB.',
        ];
    }
}
