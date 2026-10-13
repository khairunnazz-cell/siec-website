(function(){
'use strict';
var TOKEN_KEY='siec_partner_access';
var partnerToken='';
var dashboardData={rows:[],summary:{}};

function $(id){return document.getElementById(id)}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function rp(v){return 'Rp '+Number(v||0).toLocaleString('id-ID',{maximumFractionDigits:0})}
function money(v,c){return c==='USD'?'$'+Number(v||0).toLocaleString('en-US',{maximumFractionDigits:2}):rp(v)}
function dateId(v){if(!v)return '-';return new Date(v).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})}
function statusLabel(s){return {checking:'Menunggu verifikasi',valid:'Pembayaran valid',in_progress:'Sedang diproses',completed:'Selesai',rejected:'Ditolak'}[s]||s||'-'}
function commissionLabel(s){return {earned:'Hak komisi',pending:'Menunggu',cancelled:'Dibatalkan'}[s]||s}

async function rpc(name,args){var r=await db.rpc(name,args);if(r.error)throw r.error;return r.data}
async function doLogin(token){
  var info=await rpc('partner_login',{p_access_token:token});
  partnerToken=token;sessionStorage.setItem(TOKEN_KEY,token);
  $('partnerName').textContent=info.partner_name;$('partnerRate').textContent=Number(info.commission_rate)+'%';
  $('partnerLogin').hidden=true;$('partnerDashboard').hidden=false;
  await loadDashboard();
}
async function loadDashboard(){
  $('partnerRows').innerHTML='<tr><td colspan="7" class="empty-cell">Memuat data…</td></tr>';
  try{
    var data=await rpc('get_partner_dashboard',{p_access_token:partnerToken,p_date_from:$('partnerFrom').value||null,p_date_to:$('partnerTo').value||null});
    dashboardData=data||{rows:[],summary:{}};
    if(data.partner){$('partnerName').textContent=data.partner.name;$('partnerRate').textContent=Number(data.partner.commission_rate)+'%'}
    renderSummary();renderRows();
    $('lastUpdated').textContent='Diperbarui '+new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
  }catch(e){
    if(/token|akses|valid/i.test(e.message||'')){logout();return}
    $('partnerRows').innerHTML='<tr><td colspan="7" class="empty-cell">Gagal memuat: '+esc(e.message)+'</td></tr>';
  }
}
function renderSummary(){var s=dashboardData.summary||{};
  $('sumClients').textContent=Number(s.total_clients||0).toLocaleString('id-ID');
  $('sumVerified').textContent=Number(s.verified_clients||0)+' pembayaran terverifikasi';
  $('sumEarnedIdr').textContent=rp(s.earned_idr);$('sumPendingIdr').textContent=rp(s.pending_idr);
  $('sumUsd').textContent=money(s.earned_usd,'USD');$('sumUsdNote').textContent='Potensi: '+money(s.pending_usd,'USD');
}
function filteredRows(){var type=$('partnerTypeFilter').value,state=$('partnerStatusFilter').value;return (dashboardData.rows||[]).filter(function(r){return(!type||r.registration_type===type)&&(!state||r.commission_state===state)})}
function renderRows(){var rows=filteredRows();if(!rows.length){$('partnerRows').innerHTML='<tr><td colspan="7" class="empty-cell">Belum ada klien pada filter ini.</td></tr>';return}
  $('partnerRows').innerHTML=rows.map(function(r){var phone=String(r.phone||'').replace(/\D/g,'');if(phone.indexOf('0')===0)phone='62'+phone.slice(1);else if(phone.indexOf('8')===0)phone='62'+phone;
    return '<tr><td>'+dateId(r.created_at)+'</td><td><strong>'+esc(r.reg_code)+'</strong><small>'+(r.registration_type==='test'?'Tes':'Terjemahan')+'</small></td><td><strong>'+esc(r.client_name)+'</strong><small>'+(phone?'<a href="https://wa.me/'+phone+'" target="_blank" rel="noopener">'+esc(r.phone)+'</a>':esc(r.email||'-'))+'</small></td><td><span class="service-tag">'+esc(r.service)+'</span></td><td>'+money(r.base_price,r.currency)+'</td><td><span class="badge badge-'+esc(r.commission_state)+'">'+esc(commissionLabel(r.commission_state))+'</span><small>'+esc(statusLabel(r.payment_status))+'</small></td><td class="commission">'+money(r.commission_amount,r.currency)+'</td></tr>'
  }).join('')
}
function csvCell(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'}
function exportCsv(){var rows=filteredRows();if(!rows.length)return;var out=[['Tanggal','Kode','Jenis','Nama','HP','Email','Layanan','Harga Dasar','Mata Uang','Status Bayar','Status Komisi','Komisi'].map(csvCell).join(',')];rows.forEach(function(r){out.push([dateId(r.created_at),r.reg_code,r.registration_type,r.client_name,r.phone,r.email,r.service,r.base_price,r.currency,statusLabel(r.payment_status),commissionLabel(r.commission_state),r.commission_amount].map(csvCell).join(','))});var b=new Blob(['\ufeff'+out.join('\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='referral-stain-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
function logout(){partnerToken='';sessionStorage.removeItem(TOKEN_KEY);$('partnerDashboard').hidden=true;$('partnerLogin').hidden=false;$('partnerToken').value=''}

document.addEventListener('DOMContentLoaded',function(){
  $('togglePartnerToken').onclick=function(){var i=$('partnerToken');i.type=i.type==='password'?'text':'password';this.textContent=i.type==='password'?'Lihat':'Tutup'};
  $('partnerLoginForm').onsubmit=async function(e){e.preventDefault();var btn=$('partnerLoginBtn'),err=$('partnerLoginError'),token=$('partnerToken').value.trim();err.hidden=true;btn.disabled=true;btn.textContent='Memeriksa akses…';try{await doLogin(token)}catch(x){err.textContent=x.message||'Kode akses salah';err.hidden=false}finally{btn.disabled=false;btn.textContent='Masuk ke Dashboard'}};
  $('refreshPartner').onclick=loadDashboard;$('applyPartnerFilter').onclick=loadDashboard;$('partnerTypeFilter').onchange=renderRows;$('partnerStatusFilter').onchange=renderRows;$('exportPartnerCsv').onclick=exportCsv;$('partnerLogout').onclick=logout;
  var saved=sessionStorage.getItem(TOKEN_KEY);if(saved){doLogin(saved).catch(logout)}
});
})();
