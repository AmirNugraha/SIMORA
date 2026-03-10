<?php

namespace App\Http\Controllers\Api;

use App\Exports\MasterDataTemplateExport;
use App\Http\Controllers\Controller;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MasterDataTemplateController extends Controller
{
    public function download(string $type): BinaryFileResponse
    {
        if (!MasterDataTemplateExport::supports($type)) {
            abort(404, 'Template tidak ditemukan.');
        }

        $filename = "template_{$type}.xlsx";

        return Excel::download(new MasterDataTemplateExport($type), $filename);
    }
}
