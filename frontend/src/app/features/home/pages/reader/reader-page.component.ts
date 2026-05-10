import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reader-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reader-page.component.html',
  styleUrls: ['./reader-page.component.css']
})
export class ReaderPageComponent implements OnInit, OnDestroy {
  @Input() service: any; 
  @Output() closeReader = new EventEmitter<void>();

  displayContent: string = ""; // Biến này để hiện chữ ra màn hình
  isGenerating: boolean = true;
  private typewriterInterval: any;

  ngOnInit() {
    // Vừa hiện lên là chạy ngay
    if (this.service) {
      this.startAIWriting();
    }
  }

  ngOnDestroy() {
    if (this.typewriterInterval) clearInterval(this.typewriterInterval);
  }

  startAIWriting() {
    this.isGenerating = true;
    this.displayContent = ""; 

    const fullText = `[BẢN TIN PHÂN TÍCH AI - ${new Date().toLocaleDateString()}] \n\nHệ thống Connected đã nhận diện gói: "${this.service?.title}". \n\nDựa trên mô tả "${this.service?.description}", AI nhận thấy đây là nội dung quan trọng cần được tối ưu hóa. \n\nPhân tích chi tiết: \n- Trạng thái: Đã xác thực Premium.\n- Xu hướng: Đang tăng trưởng mạnh tại Việt Nam.\n- Khuyến nghị: Admin nên cập nhật nội dung này mỗi 24h để giữ tương tác cao nhất. \n\nCảm ơn bạn đã sử dụng dịch vụ của chúng tôi!`;

   setTimeout(() => {
    this.isGenerating = false;
    let index = 0;

    this.typewriterInterval = setInterval(() => {
      if (index < fullText.length) {
        this.displayContent += fullText[index];
        index++;
      } else {
        clearInterval(this.typewriterInterval);
      }
    }, 10); 
  }, 200);
  }

  close() {
    this.closeReader.emit();
  }
}