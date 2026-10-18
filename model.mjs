export const source = {
  repo: 'https://github.com/NgoHung0704/DeClaw',
  commit: '2f37214e73cbbdadc8d037ce78d6c0e81a73a1ed',
};

export const components = [
  { id:'cli', n:'01', name:'CLI / REPL', object:'Bảng điều khiển tích hợp', boundary:'Lõi Python', x:-156,y:-7,
    summary:'Điểm vào hiện tại của DeClaw. Typer nạp cấu hình, lắp các phụ thuộc và mở phiên hội thoại hoặc chạy lệnh index.',
    input:'Lệnh của người dùng, cấu hình workspace và data directory.', output:'Phiên chat, yêu cầu lập chỉ mục hoặc báo cáo.',
    inside:['Typer commands trong main.py','REPL và lắp phiên trong brain/repl.py','DocumentStack dùng chung cho chat và index'],
    rule:'Gateway FastAPI và trải nghiệm desktop kết nối chưa nằm trong đường chạy hiện tại.',
    files:['declaw/main.py','declaw/brain/repl.py','declaw/documents/session.py'], links:['agent','documents'] },
  { id:'agent', n:'02', name:'Agent loop', object:'Bo điều phối', boundary:'Lõi Python', x:-52,y:-7,
    summary:'LangGraph luân phiên suy luận và chạy công cụ. Model nhận cùng danh sách tool mà ToolNode được phép thực thi.',
    input:'Lịch sử tin nhắn, tool observations, typed tool schemas.', output:'Tool calls hoặc câu trả lời cuối cùng.',
    inside:['Node agent gọi model đã được inject','Node tools thực thi bằng ToolNode','tools_condition chọn lặp tiếp hoặc END'],
    rule:'Lỗi công cụ dự kiến trở thành observation để agent có thể điều chỉnh; không có eval/exec để dựng tool.',
    files:['declaw/brain/loop.py','declaw/brain/state.py','declaw/brain/chat_model.py'], links:['cli','tools','ollama'] },
  { id:'tools', n:'03', name:'Typed tools', object:'Bảng phím công cụ', boundary:'Lõi Python', x:52,y:-7,
    summary:'ToolRegistry đăng ký các instance cụ thể, xuất schema và lắp các wrapper cho quyền, lọc nội dung và audit.',
    input:'Tên tool và đối số có schema.', output:'Kết quả có kiểu hoặc lỗi được xử lý.',
    inside:['Filesystem read, list, write, move','ToolClass.READ đi qua nhánh đọc','Non-READ đi qua confirmation; audit bọc ngoài'],
    rule:'Chỉ tool có produces_external_content được bọc sanitizer ở nhánh READ. Document search tự sàng lọc các đoạn truy hồi.',
    files:['declaw/tools/registry.py','declaw/tools/base.py','declaw/plugin_host/tools.py'], links:['approval','workspace','documents','audit'] },
  { id:'approval', n:'04', name:'Human approval', object:'Chốt duyệt đầu ra', boundary:'Lõi Python · quyết định của người dùng', x:156,y:-7,
    summary:'Chặn thao tác non-READ trước khi thực thi. Người dùng xem đề xuất và cho phép hoặc từ chối.',
    input:'Thao tác WRITE / DESTRUCTIVE đã được validate.', output:'Cho phép thực thi hoặc kết quả từ chối.',
    inside:['ConfirmationProvider','Bản mô tả thao tác cho người dùng','PermissionPromptEvent trong audit'],
    rule:'Mặc định là từ chối. Khi bị từ chối, thao tác ghi không được chạy; agent nhận kết quả từ chối.',
    files:['declaw/tools/confirmation.py','declaw/audit/tooling.py'], links:['tools','workspace','audit'] },
  { id:'workspace', n:'05', name:'Workspace files', object:'Khay nạp hồ sơ', boundary:'Tệp cục bộ · truy cập qua lõi Python', x:-156,y:78,
    summary:'Các công cụ đọc, liệt kê, ghi và di chuyển chỉ hoạt động trong workspace được cấu hình.',
    input:'Đường dẫn tương đối và nội dung cần ghi.', output:'Nội dung đọc, danh sách tệp hoặc kết quả thay đổi.',
    inside:['resolve_in_workspace kiểm tra đường dẫn','filesystem_read đánh dấu nội dung bên ngoài','WRITE và MOVE đi qua approval'],
    rule:'Không được thoát workspace. Dữ liệu đọc từ tệp là nội dung không đáng tin cậy trước khi được sàng lọc.',
    files:['declaw/tools/builtin/filesystem.py','declaw/tools/builtin/_paths.py'], links:['tools','sanitizer','documents'] },
  { id:'documents', n:'06', name:'Document pipeline', object:'Buồng quét và chia đoạn', boundary:'Lõi Python', x:-52,y:78,
    summary:'Lập chỉ mục tài liệu thay đổi, lưu chunks và truy hồi các đoạn có metadata trích dẫn.',
    input:'PDF, DOCX, XLSX, TXT, Markdown hoặc truy vấn ngôn ngữ tự nhiên.', output:'Chunks đã lưu hoặc safe search hits có nguồn trích dẫn.',
    inside:['Indexer so sánh content hash với catalog','Plugin parse → embeddings → lưu chunks → cập nhật catalog','Search top-k → ChunkSanitizer → citations'],
    rule:'Catalog chỉ cập nhật sau khi lưu thành công. Không sàng lọc tất cả chunks khi index; sàng lọc khi truy hồi. Chưa có OCR.',
    files:['declaw/documents/indexer.py','declaw/documents/search.py','declaw/documents/store.py','declaw/documents/citations.py','declaw/documents/session.py'], links:['plugins','storage','ollama','sanitizer'] },
  { id:'sanitizer', n:'07', name:'Content sanitizer', object:'Buồng sàng lọc nội dung', boundary:'Lõi Python · phiên classifier riêng', x:52,y:78,
    summary:'Sàng lọc văn bản ngoài trước khi đưa vào ngữ cảnh agent. Nội dung không an toàn bị thay bằng kết quả cách ly.',
    input:'Kết quả đọc ngoài hoặc các chunks thuộc top-k.', output:'Nội dung an toàn hoặc quarantine ID.',
    inside:['Classifier dùng phiên Ollama tách biệt','Quarantine lưu sự kiện bị chặn','ChunkSanitizer cache verdict theo hash nội dung'],
    rule:'Classifier lỗi thì fail closed. Đây là lớp sàng lọc ở ứng dụng, không phải bảo đảm phát hiện mọi prompt injection.',
    files:['declaw/sanitizer/sanitizer.py','declaw/sanitizer/classifier.py','declaw/sanitizer/quarantine.py','declaw/documents/search.py'], links:['ollama','agent','audit'] },
  { id:'storage', n:'08', name:'SQLite + ChromaDB', object:'Khoang ổ lưu trữ', boundary:'Phụ thuộc dữ liệu cục bộ', x:156,y:78,
    summary:'SQLite giữ bản ghi có cấu trúc; ChromaDB giữ vector tài liệu và semantic memory. Không phải các HTTP microservice.',
    input:'Tasks, audit events, episodes, catalog, embeddings và text payloads.', output:'Bản ghi cấu trúc và kết quả tìm kiếm tương đồng.',
    inside:['SQLite qua SQLAlchemy session','Chroma collections theo mục đích','Fernet mã hóa text payloads trước khi lưu Chroma'],
    rule:'Vector embeddings và một số metadata không được mã hóa. Không mô tả toàn bộ SQLite là encrypted.',
    files:['declaw/db/engine.py','declaw/documents/catalog.py','declaw/documents/store.py','declaw/memory/chroma.py'], links:['documents','memory','audit'] },
  { id:'ollama', n:'09', name:'Ollama', object:'Cụm mô hình riêng', boundary:'Dịch vụ riêng · host cấu hình được', x:-156,y:-92,
    summary:'Dịch vụ inference cho agent, embeddings và bộ phân loại. Các vai trò chia sẻ dịch vụ nhưng không dùng chung phiên hội thoại.',
    input:'Chat messages, văn bản embedding hoặc yêu cầu phân loại.', output:'AIMessage, vectors hoặc verdict.',
    inside:['Agent mặc định qwen2.5:3b','Classifier mặc định qwen2.5:7b','Embeddings mặc định nomic-embed-text'],
    rule:'Các tên model là mặc định cấu hình, không phải ba microservice. Host Ollama có thể được đổi.',
    files:['declaw/brain/chat_model.py','declaw/sanitizer/classifier.py','declaw/memory/embeddings.py','declaw/config.py'], links:['agent','documents','sanitizer','memory'] },
  { id:'plugins', n:'10', name:'Plugin host / doc-intel', object:'Khe cartridge doc-intel', boundary:'Host trong lõi · worker là process riêng', x:-52,y:-92,
    summary:'PluginHost kiểm tra manifest và quyền, giám sát worker và gọi doc-intel để parse các định dạng tài liệu.',
    input:'Capability như parse và arguments theo schema.', output:'Chunks có ordinal, page, sheet hoặc heading.',
    inside:['Manifest, grants và schema validation','Một Python subprocess cho mỗi plugin đã load','NDJSON request / response qua stdio'],
    rule:'Tách subprocess không đồng nghĩa với OS sandbox. Plugin phải được bật và có quyền phù hợp.',
    files:['declaw/plugin_host/host.py','declaw/plugin_host/process.py','declaw/plugin_host/ipc.py','declaw/plugin_host/permissions.py','plugins/builtin/doc-intel/plugin.yaml'], links:['documents','tools'] },
  { id:'memory', n:'11', name:'Memory + key vault', object:'Bo nhớ và khóa', boundary:'Lõi Python · OS keyring / encrypted fallback', x:52,y:-92,
    summary:'Kết hợp bộ đệm hội thoại, episodic records và semantic vectors; khóa cho text payloads được quản lý qua vault.',
    input:'Tin nhắn, episodes, nội dung cần ghi nhớ và embedding.', output:'Ngữ cảnh hoặc dữ liệu lưu / xuất / xóa.',
    inside:['Conversation buffer','Episodic memory trong SQLite','Semantic memory và Fernet text encryption'],
    rule:'Không khẳng định mọi loại memory đều tự động được đưa vào mỗi lượt agent. Vault có encrypted-file fallback khi keyring không dùng được.',
    files:['declaw/memory/buffer.py','declaw/memory/episodic.py','declaw/memory/semantic.py','declaw/memory/crypto.py'], links:['storage','ollama'] },
  { id:'audit', n:'12', name:'Audit / HTTP observer', object:'Máy in nhật ký', boundary:'Lõi Python', x:156,y:-92,
    summary:'Ghi tool calls, quyết định quyền, quarantine và HTTP requests được instrument trong tiến trình lõi.',
    input:'Các sự kiện được instrument và lời gọi httpx.', output:'Bản ghi SQLite, báo cáo và audit export.',
    inside:['AuditLogger và event schema','Tool wrapper ngoài cùng','HTTP observer và allowlist host cục bộ'],
    rule:'HTTP observer không phải firewall của hệ điều hành; không chứng minh mọi process đều không gửi dữ liệu ra ngoài.',
    files:['declaw/audit/logger.py','declaw/audit/tooling.py','declaw/audit/egress.py'], links:['tools','approval','sanitizer','storage'] },
];

const s = (at, title, text, event = null) => ({at,title,text,event});
export const journeys = {
  read:{name:'Đọc một tệp', example:'“Đọc ghi chú trong workspace”', steps:[
    s('cli','Nhận yêu cầu','REPL đưa yêu cầu của người dùng vào phiên hội thoại.'),
    s('agent','Suy luận và chọn tool','Agent gọi Ollama, nhận filesystem_read với đối số đường dẫn.'),
    s('tools','Chọn nhánh READ','ToolRegistry dùng schema đã đăng ký; READ không cần confirmation.'),
    s('workspace','Đọc trong workspace','resolve_in_workspace kiểm tra phạm vi trước khi đọc nội dung.'),
    s('sanitizer','Sàng lọc nội dung ngoài','Văn bản được kiểm tra trong phiên classifier riêng. Không đưa thẳng vào agent.'),
    s('audit','Ghi kết quả tool','Audit wrapper ngoài cùng ghi kết quả đã được sàng lọc như agent nhìn thấy.'),
    s('agent','Quan sát và trả lời','Tool observation an toàn quay lại agent; model có thể trả lời hoặc gọi thêm tool.'),
  ]},
  write:{name:'Ghi / di chuyển tệp',example:'“Lưu bản ghi chú mới”',steps:[
    s('cli','Nhận yêu cầu thay đổi','Người dùng mô tả thay đổi mong muốn.'),
    s('agent','Đề xuất thao tác','Model tạo typed tool call như filesystem_write hoặc filesystem_move.'),
    s('tools','Phân loại non-READ','ToolRegistry gắn confirmation wrapper trước khi chạy thao tác.'),
    s('approval','Đợi quyết định của người dùng','Đề xuất phải được chấp thuận; mặc định là từ chối.','approval'),
    s('workspace','Thực hiện thay đổi đã duyệt','Công cụ kiểm tra workspace và thực thi thay đổi.'),
    s('audit','Ghi quyết định và kết quả','Permission decision và tool call được audit ghi nhận.'),
    s('agent','Trả kết quả cho agent','Kết quả thao tác trở thành observation cho lượt suy luận tiếp theo.'),
  ]},
  index:{name:'Lập chỉ mục tài liệu',example:'declaw index',steps:[
    s('cli','Chạy lệnh index','CLI dùng DocumentStack để lắp catalog, store, embedder và parser.'),
    s('workspace','Quét tài liệu được hỗ trợ','Tìm PDF, DOCX, XLSX, TXT, Markdown trong phạm vi workspace.'),
    s('documents','So sánh content hash','Indexer so sánh hash với catalog; bỏ qua tệp không đổi.'),
    s('plugins','Parse qua worker riêng','Host kiểm tra quyền và gửi parse bằng NDJSON qua stdio tới doc-intel.'),
    s('documents','Nhận chunks và metadata','Các đoạn có ordinal và thông tin trang, sheet hoặc heading. Tệp scan không có text được báo.'),
    s('ollama','Sinh embeddings','Embedder gọi model embedding cấu hình trong Ollama.'),
    s('storage','Lưu chunks và vectors','Text payloads được mã hóa bằng Fernet; vectors vẫn cần cho phép so sánh tương đồng.'),
    s('documents','Cập nhật catalog sau cùng','Chỉ đánh dấu hash đã index sau khi store thành công; không chạy classifier trên toàn bộ corpus.'),
  ]},
  search:{name:'Hỏi đáp tài liệu',example:'“Tài liệu nói gì về …?”',steps:[
    s('cli','Nhận câu hỏi','Phiên chat đưa câu hỏi vào agent.'),
    s('agent','Chọn document_search','Model yêu cầu tìm tài liệu qua tool đã đăng ký.'),
    s('documents','Chuẩn bị truy vấn','Đường tìm kiếm dùng store và ChunkSanitizer đã được lắp trong phiên.'),
    s('ollama','Embedding câu hỏi','Tạo query vector qua model embedding.'),
    s('storage','Truy hồi top-k','ChromaDB so khớp vector, trả chunks được giải mã và source metadata.'),
    s('sanitizer','Sàng lọc các đoạn truy hồi','Chỉ các đoạn an toàn được chuyển tiếp; cache verdict theo hash giúp tránh phân loại lặp.'),
    s('documents','Dựng kết quả có trích dẫn','Safe hits giữ metadata để dựng structural citations. Các đoạn bị chặn bị loại bỏ.'),
    s('agent','Tổng hợp câu trả lời','Agent nhận kết quả tìm kiếm và trả lời dựa trên các đoạn an toàn có nguồn.'),
  ]},
};

export function journeySteps(id, outcome='normal') {
  const base = journeys[id];
  if (!base) throw new Error(`Unknown journey: ${id}`);
  const steps = base.steps.map(v=>({...v}));
  if (id==='write' && outcome==='deny') {
    const i=steps.findIndex(v=>v.event==='approval');
    return [...steps.slice(0,i),s('approval','Người dùng từ chối','Confirmation trả kết quả từ chối. Công cụ ghi không được chạy.'),s('audit','Ghi nhận việc từ chối','PermissionPromptEvent và tool call ghi kết quả bị từ chối.'),s('agent','Nhận refusal observation','Agent biết thao tác chưa được thực hiện; không có thay đổi tệp.')];
  }
  if (['read','search'].includes(id) && outcome==='unsafe') {
    const i=steps.findIndex(v=>v.at==='sanitizer');
    return [...steps.slice(0,i),s('sanitizer','Nội dung bị cách ly','Classifier phát hiện nội dung không an toàn hoặc gặp lỗi. Văn bản không an toàn bị chặn.'),s('audit','Ghi quarantine event','Quarantine lưu dấu vết; audit ghi sự kiện được instrument.'),...(id==='search'?[s('documents','Loại đoạn bị chặn','Chỉ safe hits còn lại có thể được trả về; nếu không còn hit an toàn thì kết quả rỗng.')]:[]),s('agent','Nhận kết quả đã lọc','Agent không nhận văn bản bị cách ly; không diễn giải văn bản đó như chỉ dẫn.')];
  }
  return steps;
}

export function sourceLink(path) {
  return `${source.repo}/blob/${source.commit}/${path}`;
}
