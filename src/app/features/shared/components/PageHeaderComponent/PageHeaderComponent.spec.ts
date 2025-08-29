import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './PageHeaderComponent';

describe('PageHeaderComponent', () => {
  let component: PageHeaderComponent;
  let fixture: ComponentFixture<PageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders title and subtitle inputs', () => {
    component.title = 'My Title';
    component.subtitle = 'My Subtitle';
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('My Title');
    expect(host.textContent).toContain('My Subtitle');
  });
});
