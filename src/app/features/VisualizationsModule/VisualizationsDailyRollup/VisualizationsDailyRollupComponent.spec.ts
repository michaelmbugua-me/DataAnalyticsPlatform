import {ComponentFixture, TestBed} from '@angular/core/testing';
import {VisualizationsDailyRollupComponent} from './VisualizationsDailyRollupComponent';

describe('VisualizationsDailyRollupComponent', () => {

  let component: VisualizationsDailyRollupComponent;
  let fixture: ComponentFixture<VisualizationsDailyRollupComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [], imports: [VisualizationsDailyRollupComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(VisualizationsDailyRollupComponent);
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
