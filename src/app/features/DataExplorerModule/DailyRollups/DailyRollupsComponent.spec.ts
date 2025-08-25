import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DailyRollupsComponent} from './DailyRollupsComponent';

describe('DailyRollupsComponent', () => {

  let component: DailyRollupsComponent;
  let fixture: ComponentFixture<DailyRollupsComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [], imports: [DailyRollupsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DailyRollupsComponent);
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
