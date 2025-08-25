import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AnalysisToolsRawComponent} from './analysis-tools-raw.component';

describe('AnalysisToolsRawComponent', () => {

  let component: AnalysisToolsRawComponent;
  let fixture: ComponentFixture<AnalysisToolsRawComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [], imports: [AnalysisToolsRawComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisToolsRawComponent);
    component = fixture.componentInstance;

  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
